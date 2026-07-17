from typing import Any

from psycopg.types.json import Jsonb

from app.database.connection import criar_conexao


def buscar_indicador_id_por_nome(nome: str) -> int | None:
    sql = """
        SELECT id
        FROM ia.indicadores
        WHERE nome = %s
          AND ativo = true;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql, (nome,))
            resultado = cursor.fetchone()

    if not resultado:
        return None

    return resultado[0]


def criar_consulta_ia(
    tipo_consulta: str,
    pergunta: str | None = None,
    contexto: dict[str, Any] | None = None,
    usuario_id: int | None = None,
) -> int:
    sql = """
        INSERT INTO ia.consultas_ia (
            usuario_id,
            tipo_consulta,
            pergunta,
            contexto,
            status
        )
        VALUES (%s, %s, %s, %s, 'PROCESSANDO')
        RETURNING id;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(
                sql,
                (
                    usuario_id,
                    tipo_consulta,
                    pergunta,
                    Jsonb(contexto or {}),
                ),
            )
            consulta_id = cursor.fetchone()[0]
            conexao.commit()

    return consulta_id


def finalizar_consulta_ia(
    consulta_ia_id: int,
    status: str,
) -> None:
    sql = """
        UPDATE ia.consultas_ia
        SET status = %s,
            finalizado_em = CURRENT_TIMESTAMP
        WHERE id = %s;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql, (status, consulta_ia_id))
            conexao.commit()


def registrar_execucao_llm(
    consulta_ia_id: int,
    modelo: str,
    usage: dict[str, Any] | None = None,
    provedor: str = "OpenRouter",
    tempo_ms: int | None = None,
    status: str = "SUCESSO",
    erro: str | None = None,
) -> int:
    usage = usage or {}

    sql = """
        INSERT INTO ia.execucoes_llm (
            consulta_ia_id,
            modelo,
            provedor,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            custo,
            tempo_ms,
            status,
            erro
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(
                sql,
                (
                    consulta_ia_id,
                    modelo,
                    provedor,
                    usage.get("prompt_tokens", 0),
                    usage.get("completion_tokens", 0),
                    usage.get("total_tokens", 0),
                    usage.get("cost", 0),
                    tempo_ms,
                    status,
                    erro,
                ),
            )
            execucao_id = cursor.fetchone()[0]
            conexao.commit()

    return execucao_id


def registrar_insight(
    consulta_ia_id: int,
    tipo_insight: str,
    dados_base: dict[str, Any],
    resposta: str,
    modelo_utilizado: str,
    indicador_nome: str | None = None,
    titulo: str | None = None,
    nivel_confianca: str | None = "MEDIO",
) -> int:
    indicador_id = None

    if indicador_nome:
        indicador_id = buscar_indicador_id_por_nome(indicador_nome)

    sql = """
        INSERT INTO ia.insights (
            consulta_ia_id,
            indicador_id,
            tipo_insight,
            titulo,
            dados_base,
            resposta,
            nivel_confianca,
            modelo_utilizado
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(
                sql,
                (
                    consulta_ia_id,
                    indicador_id,
                    tipo_insight,
                    titulo,
                    Jsonb(dados_base),
                    resposta,
                    nivel_confianca,
                    modelo_utilizado,
                ),
            )
            insight_id = cursor.fetchone()[0]
            conexao.commit()

    return insight_id


def buscar_prompt_ativo_por_nome(nome: str) -> dict[str, Any] | None:
    sql = """
        SELECT
            id,
            nome,
            descricao,
            conteudo,
            versao
        FROM ia.prompts
        WHERE nome = %s
          AND ativo = true
        ORDER BY versao DESC
        LIMIT 1;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql, (nome,))
            resultado = cursor.fetchone()

    if not resultado:
        return None

    return {
        "id": resultado[0],
        "nome": resultado[1],
        "descricao": resultado[2],
        "conteudo": resultado[3],
        "versao": resultado[4],
    }


def listar_historico_insights_por_usuario(
    usuario_id: int,
    limite: int = 20,
) -> list[dict]:
    sql = """
        SELECT
            c.id AS consulta_ia_id,
            c.tipo_consulta,
            c.pergunta,
            c.contexto,
            c.status AS status_consulta,
            c.criado_em AS consulta_criada_em,
            c.finalizado_em,

            e.id AS execucao_llm_id,
            e.modelo,
            e.provedor,
            e.prompt_tokens,
            e.completion_tokens,
            e.total_tokens,
            e.custo,
            e.tempo_ms,
            e.status AS status_execucao,

            i.id AS insight_id,
            i.tipo_insight,
            i.titulo,
            i.dados_base,
            i.resposta,
            i.nivel_confianca,
            i.modelo_utilizado,
            i.criado_em AS insight_criado_em
        FROM ia.consultas_ia c
        LEFT JOIN ia.execucoes_llm e ON e.consulta_ia_id = c.id
        LEFT JOIN ia.insights i ON i.consulta_ia_id = c.id
        WHERE c.usuario_id = %s
        ORDER BY c.id DESC
        LIMIT %s;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql, (usuario_id, limite))
            resultados = cursor.fetchall()

    return [
        {
            "consulta_ia_id": linha[0],
            "tipo_consulta": linha[1],
            "pergunta": linha[2],
            "contexto": linha[3],
            "status_consulta": linha[4],
            "consulta_criada_em": linha[5],
            "finalizado_em": linha[6],
            "execucao_llm_id": linha[7],
            "modelo": linha[8],
            "provedor": linha[9],
            "prompt_tokens": linha[10],
            "completion_tokens": linha[11],
            "total_tokens": linha[12],
            "custo": linha[13],
            "tempo_ms": linha[14],
            "status_execucao": linha[15],
            "insight_id": linha[16],
            "tipo_insight": linha[17],
            "titulo": linha[18],
            "dados_base": linha[19],
            "resposta": linha[20],
            "nivel_confianca": linha[21],
            "modelo_utilizado": linha[22],
            "insight_criado_em": linha[23],
        }
        for linha in resultados
    ]

def registrar_feedback_resposta(
    insight_id: int,
    usuario_id: int,
    avaliacao: str | None = None,
    comentario: str | None = None,
) -> dict:
    sql_validacao = """
        SELECT i.id
        FROM ia.insights i
        INNER JOIN ia.consultas_ia c ON c.id = i.consulta_ia_id
        WHERE i.id = %s
          AND c.usuario_id = %s;
    """

    sql_insert = """
        INSERT INTO ia.feedback_respostas (
            insight_id,
            usuario_id,
            avaliacao,
            comentario
        )
        VALUES (%s, %s, %s, %s)
        RETURNING
            id,
            insight_id,
            usuario_id,
            avaliacao,
            comentario,
            criado_em;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql_validacao, (insight_id, usuario_id))
            insight_encontrado = cursor.fetchone()

            if not insight_encontrado:
                raise ValueError(
                    "Insight não encontrado para este usuário."
                )

            cursor.execute(
                sql_insert,
                (
                    insight_id,
                    usuario_id,
                    avaliacao,
                    comentario,
                ),
            )

            resultado = cursor.fetchone()
            conexao.commit()

    return {
        "feedback_id": resultado[0],
        "insight_id": resultado[1],
        "usuario_id": resultado[2],
        "avaliacao": resultado[3],
        "comentario": resultado[4],
        "criado_em": resultado[5],
    }
