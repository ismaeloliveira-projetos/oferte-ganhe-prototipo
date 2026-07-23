from datetime import datetime


def limpar_valor_csv(valor):
    if valor is None:
        return ""

    return str(valor).replace(";", ",").replace("\n", " ")


def montar_linha_csv(valores):
    return ";".join(limpar_valor_csv(valor) for valor in valores)


def formatar_data_hora(valor):
    if not valor:
        return "-"

    return str(valor)


def obter_codigo_loja(item):
    return (
        item.get("codigoLoja")
        or item.get("codigo_loja")
        or item.get("lojaCodigo")
        or item.get("codigo")
        or "-"
    )


def obter_nome_loja(item):
    return (
        item.get("nomeLoja")
        or item.get("nome_loja")
        or item.get("lojaNome")
        or item.get("nome")
        or item.get("loja")
        or "-"
    )


def obter_estoque_atual(item):
    return int(
        item.get("estoqueAtual")
        or item.get("estoque_atual")
        or item.get("quantidadeAtual")
        or item.get("saldoAtual")
        or 0
    )


def obter_estoque_minimo(item):
    return int(
        item.get("estoqueMinimo")
        or item.get("estoque_minimo")
        or item.get("quantidadeMinima")
        or item.get("minimo")
        or 0
    )


def obter_estoque_recomendado(item):
    return int(
        item.get("estoqueRecomendado")
        or item.get("estoque_recomendado")
        or item.get("quantidadeRecomendada")
        or item.get("recomendado")
        or 0
    )


def obter_status_estoque(item):
    if item.get("statusEstoque"):
        return item["statusEstoque"]

    if item.get("status"):
        return item["status"]

    estoque_atual = obter_estoque_atual(item)
    estoque_minimo = obter_estoque_minimo(item)
    estoque_recomendado = obter_estoque_recomendado(item)

    if estoque_atual <= estoque_minimo:
        return "Crítico"

    if estoque_atual < estoque_recomendado:
        return "Atenção"

    return "Normal"


def obter_quantidade_envio(item):
    return int(
        item.get("quantidadeEnviada")
        or item.get("quantidade_enviada")
        or item.get("quantidade")
        or 0
    )


def obter_quantidade_recebida(item):
    return int(
        item.get("quantidadeRecebida")
        or item.get("quantidade_recebida")
        or item.get("quantidade")
        or 0
    )


def obter_nome_usuario(item):
    return (
        item.get("usuarioNome")
        or item.get("usuario_nome")
        or item.get("usuarioResponsavel")
        or item.get("usuarioResponsavelNome")
        or item.get("responsavel")
        or item.get("usuarioId")
        or item.get("usuario_id")
        or "-"
    )


def montar_csv(cabecalho, linhas):
    linhas_csv = [montar_linha_csv(cabecalho)]

    for linha in linhas:
        linhas_csv.append(montar_linha_csv(linha))

    return "\ufeff" + "\n".join(linhas_csv)


def gerar_csv_estoque_geral(dados):
    return montar_csv(
        [
            "Código",
            "Loja",
            "Estoque Atual",
            "Estoque Mínimo",
            "Estoque Recomendado",
            "Status",
        ],
        [
            [
                obter_codigo_loja(estoque),
                obter_nome_loja(estoque),
                obter_estoque_atual(estoque),
                obter_estoque_minimo(estoque),
                obter_estoque_recomendado(estoque),
                obter_status_estoque(estoque),
            ]
            for estoque in dados
        ],
    )


def gerar_csv_estoque_critico(dados):
    criticos = [
        estoque for estoque in dados if obter_status_estoque(estoque) == "Crítico"
    ]

    return montar_csv(
        [
            "Código",
            "Loja",
            "Estoque Atual",
            "Estoque Mínimo",
            "Status",
        ],
        [
            [
                obter_codigo_loja(estoque),
                obter_nome_loja(estoque),
                obter_estoque_atual(estoque),
                obter_estoque_minimo(estoque),
                obter_status_estoque(estoque),
            ]
            for estoque in criticos
        ],
    )


def gerar_csv_envios(dados):
    return montar_csv(
        [
            "Data/Hora",
            "Código da Loja",
            "Loja",
            "Quantidade",
            "Remessa",
            "Responsável",
            "Status",
        ],
        [
            [
                formatar_data_hora(
                    envio.get("dataHora")
                    or envio.get("criadoEm")
                    or envio.get("dataEnvio")
                ),
                obter_codigo_loja(envio),
                obter_nome_loja(envio),
                obter_quantidade_envio(envio),
                envio.get("remessa")
                or envio.get("codigoRemessa")
                or envio.get("codigo_remessa")
                or "-",
                obter_nome_usuario(envio),
                envio.get("status") or "-",
            ]
            for envio in dados
        ],
    )


def gerar_csv_recebimentos(dados):
    return montar_csv(
        [
            "Data/Hora",
            "Código da Loja",
            "Loja",
            "Quantidade Recebida",
            "Responsável",
            "Status",
            "Observação",
        ],
        [
            [
                formatar_data_hora(
                    recebimento.get("dataHora")
                    or recebimento.get("criadoEm")
                    or recebimento.get("dataRecebimento")
                ),
                obter_codigo_loja(recebimento),
                obter_nome_loja(recebimento),
                obter_quantidade_recebida(recebimento),
                obter_nome_usuario(recebimento),
                recebimento.get("status") or "Recebido",
                recebimento.get("observacao") or "-",
            ]
            for recebimento in dados
        ],
    )


def gerar_csv_manutencoes(dados):
    return montar_csv(
        [
            "Data/Hora",
            "Código da Loja",
            "Loja",
            "Tipo",
            "Quantidade",
            "Responsável",
            "Observação",
        ],
        [
            [
                formatar_data_hora(
                    manutencao.get("dataHora")
                    or manutencao.get("criadoEm")
                    or manutencao.get("dataManutencao")
                ),
                obter_codigo_loja(manutencao),
                obter_nome_loja(manutencao),
                manutencao.get("tipo") or manutencao.get("tipoManutencao") or "-",
                manutencao.get("quantidade") or 0,
                obter_nome_usuario(manutencao),
                manutencao.get("observacao") or "-",
            ]
            for manutencao in dados
        ],
    )


def gerar_csv_usuarios(dados):
    return montar_csv(
        [
            "Nome",
            "Matrícula",
            "E-mail",
            "Ativo",
            "Criado em",
        ],
        [
            [
                usuario.get("nome") or "-",
                usuario.get("matricula") or "-",
                usuario.get("email") or "-",
                "Não" if usuario.get("ativo") is False else "Sim",
                formatar_data_hora(usuario.get("criadoEm") or usuario.get("criado_em")),
            ]
            for usuario in dados
        ],
    )


def gerar_csv_perfis(dados):
    linhas = []

    for perfil in dados:
        permissoes = perfil.get("permissoes") or []

        if isinstance(permissoes, list):
            permissoes_texto = ", ".join(str(permissao) for permissao in permissoes)
            total_permissoes = len(permissoes)
        else:
            permissoes_texto = "-"
            total_permissoes = 0

        linhas.append(
            [
                perfil.get("nomePerfil")
                or perfil.get("nome_perfil")
                or perfil.get("nome")
                or "-",
                perfil.get("nivel") or "-",
                permissoes_texto,
                total_permissoes,
            ]
        )

    return montar_csv(
        [
            "Nome",
            "Nível",
            "Permissões",
            "Total de Permissões",
        ],
        linhas,
    )


def gerar_nome_arquivo(tipo):
    agora = datetime.now().strftime("%Y%m%d-%H%M%S")

    nomes = {
        "estoque-geral": f"relatorio-estoque-geral-{agora}.csv",
        "estoque-critico": f"relatorio-estoque-critico-{agora}.csv",
        "envios": f"relatorio-envios-{agora}.csv",
        "recebimentos": f"relatorio-recebimentos-{agora}.csv",
        "manutencoes": f"relatorio-manutencoes-{agora}.csv",
        "usuarios": f"relatorio-usuarios-{agora}.csv",
        "perfis": f"relatorio-perfis-{agora}.csv",
    }

    return nomes.get(tipo, f"relatorio-{agora}.csv")


def gerar_csv_relatorio(tipo, dados):
    geradores = {
        "estoque-geral": gerar_csv_estoque_geral,
        "estoque-critico": gerar_csv_estoque_critico,
        "envios": gerar_csv_envios,
        "recebimentos": gerar_csv_recebimentos,
        "manutencoes": gerar_csv_manutencoes,
        "usuarios": gerar_csv_usuarios,
        "perfis": gerar_csv_perfis,
    }

    gerador = geradores.get(tipo)

    if not gerador:
        raise ValueError(f"Tipo de relatório não suportado: {tipo}")

    return gerador(dados)