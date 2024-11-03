import PromptSync from "prompt-sync";
import { DateTime } from "luxon";

const prompt = PromptSync({ sigint: true });

function pegar_dados(mensagem) {
    return prompt(mensagem);
}

function alertar(mensagem) {
    console.error("Erro: " + mensagem + "\n");
}

function exibir(mensagem) {
    console.log(mensagem);
}

function limpar_tela() {
    console.clear();
}

function validar_dv(cpf, dv) {
    let soma = 0;
    const digitos = dv === 1 ? 9 : 10;
    for (let i = 0; i < digitos; i++) {
        soma += parseInt(cpf[i]) * (digitos + 1 - i);
    }
    let resto = soma % 11;
    if (resto < 2) {
        resto = 0;
    } else {
        resto = 11 - resto;
    }
    return resto;
}

function validar_horario(horario, hora_inicial) {
    if (!horario.isValid) {
        alertar("Horário inválido");
        return false;
    }
    const hora = horario.hour;
    const minutos = horario.minute;
    if (hora < 8 || hora >= 19) {
        alertar("Horário de funcionamento entre 8h e 19h");
        return false;
    }
    if (hora_inicial) {
        if (
            hora < hora_inicial.hour ||
            (hora === hora_inicial.hour && minutos <= hora_inicial.minute)
        ) {
            alertar("Horário deve ser posterior ao horário inicial");
            return false;
        }
    }
    if (minutos % 15 !== 0) {
        alertar("Horário deve ser em intervalos de 15 minutos");
        return false;
    }
    return true;
}

function inserir_horario(horario_inicial) {
    let horario = pegar_dados(
        `Horário ${horario_inicial ? "final" : "inicial"} (HH:mm): `
    );
    let horario_formatado = DateTime.fromFormat(horario, "T", {
        locale: "pt-BR",
    });
    while (!validar_horario(horario_formatado, horario_inicial)) {
        horario = pegar_dados("Horário inicial (HH:mm): ");
        horario_formatado = DateTime.fromFormat(horario, "T", {
            locale: "pt-BR",
        });
    }
    return horario_formatado;
}

function inserir_data(
    mensagem = "Data de consulta: ",
    only_basic = false,
    data_inicial = null
) {
    let data = pegar_dados(mensagem);
    let data_formatada = DateTime.fromFormat(data, "dd/MM/yyyy", {
        locale: "pt-BR",
    });
    while (!validar_data_consulta(data_formatada, only_basic, data_inicial)) {
        data = pegar_dados(mensagem);
        data_formatada = DateTime.fromFormat(data, "dd/MM/yyyy", {
            locale: "pt-BR",
        });
    }
    return data_formatada;
}

function validacao_data(data) {
    if (!data.isValid) {
        alertar("Data inválida");
        return false;
    }
    return true;
}

function validar_data_consulta(data, only_basic = false, data_inicial = null) {
    if (!validacao_data(data)) {
        return false;
    }
    if (data_inicial && data < data_inicial) {
        alertar("Data de consulta deve ser posterior a data inicial");
        return false;
    }
    if (only_basic) {
        return true;
    }
    if (data < DateTime.now()) {
        alertar("Data de consulta deve ser posterior a data atual");
        return false;
    }
    return true;
}

class Paciente {
    #cpf;
    #nome;
    #data_nascimento;

    constructor(pacientes) {
        this.#cpf = this.#inserir_cpf(pacientes);
        this.#nome = this.#inserir_nome();
        this.#data_nascimento = this.#inserir_data_nascimento();
    }

    #validar_cpf(cpf, pacientes) {
        if (pacientes[cpf]) {
            alertar("CPF ja cadastrado");
            return false;
        }

        if (cpf.length !== 11) {
            alertar("CPF deve conter 11 digitos");
            return false;
        }
        if (cpf.split("").every((digito) => digito === cpf[0])) {
            alertar("CPF inválido");
            return false;
        }

        let primeiroDigito = validar_dv(cpf, 1);
        let segundoDigito = validar_dv(cpf, 2);
        if (
            primeiroDigito !== parseInt(cpf[9]) ||
            segundoDigito !== parseInt(cpf[10])
        ) {
            alertar("CPF inválido");
            return false;
        }
        return true;
    }

    #validar_nome(nome) {
        if (nome.length < 5) {
            alertar("Nome deve conter pelo menos 5 caracteres");
            return false;
        }
        return true;
    }

    #validar_data_nascimento(data) {
        if (!data.isValid) {
            alertar("Data inválida");
            return false;
        }
        if (DateTime.now().diff(data, "years").toObject().years < 13) {
            alertar("Paciente deve ter pelo menos 13 anos");
            return false;
        }
        return true;
    }

    #inserir_cpf(pacientes) {
        let cpf = pegar_dados("CPF: ");
        while (!this.#validar_cpf(cpf, pacientes)) {
            cpf = pegar_dados("CPF: ");
        }
        return cpf;
    }

    #inserir_data_nascimento() {
        let data_nascimento = pegar_dados("Data de Nascimento: ");
        let data = DateTime.fromFormat(data_nascimento, "dd/MM/yyyy", {
            locale: "pt-BR",
        });
        while (!this.#validar_data_nascimento(data)) {
            data_nascimento = pegar_dados("Data de Nascimento: ");
            data = DateTime.fromFormat(data_nascimento, "dd/MM/yyyy", {
                locale: "pt-BR",
            });
        }
        return data;
    }

    #inserir_nome() {
        let nome = pegar_dados("Nome: ");
        while (!this.#validar_nome(nome)) {
            nome = pegar_dados("Nome: ");
        }
        return nome;
    }

    get cpf() {
        return this.#cpf;
    }

    get nome() {
        return this.#nome;
    }

    get data_nascimento() {
        return this.#data_nascimento.toFormat("dd/MM/yyyy");
    }

    get idade() {
        return parseInt(
            DateTime.now().diff(this.#data_nascimento, "years").toObject().years
        );
    }
}

class Consulta {
    #data;
    #horario_inicial;
    #horario_final;

    constructor() {
        this.#data = inserir_data();
        this.#horario_inicial = inserir_horario();
        this.#horario_final = inserir_horario(this.#horario_inicial);
    }

    get data_formatada() {
        return this.#data.toFormat("dd/MM/yyyy");
    }

    get data() {
        return this.#data;
    }

    get horario_inicial_formatado() {
        return this.#horario_inicial.toFormat("HH:mm");
    }

    get horario_final_formatado() {
        return this.#horario_final.toFormat("HH:mm");
    }

    get data_com_duracao() {
        return this.#data.plus({
            hours: this.#horario_inicial.hour,
            minutes: this.#horario_inicial.minute,
        });
    }

    get duracao() {
        return this.#horario_final
            .diff(this.#horario_inicial, ["hours", "minutes"])
            .toObject();
    }

    get tempo_formatado() {
        return `${this.duracao.hours}:${this.duracao.minutes}`;
    }

    get is_future() {
        return this.data_com_duracao > DateTime.now();
    }
}

class Consultorio {
    #pacientes;
    #consultas_agendadas;

    constructor() {
        this.#pacientes = {};
        this.#consultas_agendadas = {};
    }

    get pacientes() {
        return this.#pacientes;
    }

    get consultas_agendadas() {
        return this.#consultas_agendadas;
    }

    cadastrar_paciente() {
        const paciente = new Paciente(this.pacientes);
        this.#pacientes[paciente.cpf] = paciente;
        exibir("\nPaciente cadastrado com sucesso!\n");
    }

    paciente_possui_consulta(cpf) {
        const consultas_paciente = this.#consultas_agendadas[cpf];
        const ultima_consulta =
            consultas_paciente[consultas_paciente.length - 1];
        if (ultima_consulta.is_future) {
            alertar("paciente está agendado");
            return true;
        }
        return false;
    }

    excluir_paciente() {
        const cpf = pegar_dados("CPF: ");
        if (this.#pacientes[cpf]) {
            if (this.paciente_possui_consulta(cpf)) return;
            delete this.#pacientes[cpf];
            delete this.#consultas_agendadas[cpf];
            exibir("\nPaciente excluído com sucesso!\n");
        }
    }

    cancelar_consulta() {
        const cpf = this.buscar_consulta_futura();
        if (cpf) {
            const consultas_paciente = this.#consultas_agendadas[cpf];
            consultas_paciente.pop();
            this.#consultas_agendadas[cpf] = consultas_paciente;
            exibir("Agendamento cancelado com sucesso!\n");
        }
    }

    agendar_consulta() {
        const cpf = pegar_dados("CPF: ");
        const paciente = this.#pacientes[cpf];
        const consultas_paciente = this.#consultas_agendadas[cpf];
        if (!paciente) {
            alertar("Paciente não cadastrado");
            return;
        }
        if (consultas_paciente && this.paciente_possui_consulta(cpf)) return;

        if (!consultas_paciente)
            this.#consultas_agendadas[cpf] = [new Consulta()];
        else {
            this.#consultas_agendadas[cpf].append(new Consulta());
        }
        exibir("Consulta agendada");
    }

    buscar_consulta_futura() {
        let cpf;
        while (true) {
            cpf = pegar_dados("CPF: ");
            if (this.#pacientes[cpf]) break;
            alertar("paciente não cadastrado");
        }
        let data_formatada;
        while (true) {
            const data = pegar_dados("Data de consulta: ");
            data_formatada = DateTime.fromFormat(data, "dd/MM/yyyy", {
                locale: "pt-BR",
            });
            if (data_formatada.isValid) break;
            alertar("Data inválida");
        }

        const horario_inicial = inserir_horario();

        const consultas_paciente = this.#consultas_agendadas[cpf];
        if (consultas_paciente) {
            const ultima_consulta =
                consultas_paciente[consultas_paciente.length - 1];
            if (
                ultima_consulta.data_formatada === data_formatada &&
                ultima_consulta.horario_inicial === horario_inicial
            ) {
                exibir("Consulta encontrada");
                return;
            }
            if (!ultima_consulta.is_future) {
                alertar("Não foi encontrada consultas furturas");
                return;
            }
            return cpf;
        }
        exibir("Nenhuma consulta agendada");
        return;
    }

    listar_pacientes(order = "nome") {
        exibir("Pacientes:");
        const pacientes_ordenados = Object.values(this.#pacientes).sort(
            (a, b) => {
                const a_formatted =
                    order === cpf ? parseInt(a.cpf) : a[order].toLowerCase();
                const b_formatted =
                    order === cpf ? parseInt(b.cpf) : b[order].toLowerCase();
                return a_formatted.localeCompare(b_formatted);
            }
        );
        exibir("-----------------------------------------------------------");
        exibir("CPF         Nome                              Dt.Nasc.  Idade");
        exibir("-----------------------------------------------------------");
        pacientes_ordenados.forEach((paciente) => {
            exibir(
                `${paciente.cpf} ${paciente.nome.padEnd(33, " ")} ${paciente.data_nascimento} ${paciente.idade}`
            );

            const consultas_paciente = this.#consultas_agendadas[paciente.cpf];
            if (!consultas_paciente || consultas_paciente.length === 0) return;
            const ultima_consulta =
                consultas_paciente[consultas_paciente.length - 1];
            if (ultima_consulta.is_future) {
                exibir(
                    `            Agendado para ${ultima_consulta.data_formatada}`
                );
                exibir(
                    `            ${ultima_consulta.horario_inicial_formatado} às ${ultima_consulta.horario_final_formatado}`
                );
            }
        });
        exibir("-----------------------------------------------------------");
    }

    listar_agenda() {
        let data_inicial = inserir_data("Data inicial: ", true);
        let data_final = inserir_data("Data final: ", true, data_inicial);

        const consultas = [];
        for (const paciente in this.#consultas_agendadas) {
            const consultas_paciente = this.#consultas_agendadas[paciente];
            if (consultas_paciente) {
                consultas_paciente.forEach((consulta) => {
                    if (
                        consulta.data >= data_inicial &&
                        consulta.data <= data_final
                    ) {
                        consultas.push({
                            consulta,
                            paciente: this.#pacientes[paciente],
                        });
                    }
                });
            }
        }
        const consultas_ordenadas = consultas.sort((a, b) => {
            const a_formatted = a.data_com_duracao;
            const b_formatted = b.data_com_duracao;
            return a_formatted.localeCompare(b_formatted);
        });
        exibir("Consultas:");
        exibir(
            "------------------------------------------------------------------------"
        );
        exibir(
            "Data      H.Ini H.Fim Tempo Nome                       Dt.Nasc. "
        );
        consultas_ordenadas.forEach(({ consulta, paciente }, index) => {
            const data =
                index !== 0 &&
                consulta.data_formatada === consultas[index - 1].data_formatada
                    ? "".padStart(10, " ")
                    : `${consulta.data_formatada}`;
            exibir(
                `${data} ${consulta.horario_inicial_formatado} ${consulta.horario_final_formatado}  ${consulta.tempo_formatado} ${paciente.nome.padEnd(24, " ")} ${paciente.data_nascimento}`
            );
        });
        exibir(
            "------------------------------------------------------------------------"
        );
    }
}

function main() {
    const consultorio = new Consultorio();
    main_loop: while (true) {
        limpar_tela();
        exibir("Consultório");
        exibir("1 - Cadastro de pacientes");
        exibir("2 - Agenda");
        exibir("3 - Sair");
        const opcao = pegar_dados("Opção: ");
        switch (opcao) {
            case "1":
                menu_paciente(consultorio);
                break;
            case "2":
                menu_agenda(consultorio);
                break;
            case "3":
                exibir("Saindo...");
                break main_loop;
            default:
                alertar("Opção inválida");
                break;
        }
    }
}

function menu_paciente(consultorio) {
    main_loop: while (true) {
        exibir("Paciente");
        exibir("1 - Cadastrar paciente");
        exibir("2 - Excluir paciente");
        exibir("3 - Listar pacientes (ordenado por cpf)");
        exibir("4 - Listar pacientes (ordenado por nome)");
        exibir("5 - Voltar para o menu principal");
        const opcao = pegar_dados("Opção: ");
        switch (opcao) {
            case "1":
                consultorio.cadastrar_paciente();
                break;
            case "2":
                consultorio.excluir_paciente();
                break;
            case "3":
                consultorio.listar_pacientes("cpf");
                break;
            case "4":
                consultorio.listar_pacientes("nome");
                break;
            case "5":
                exibir("Voltando...");
                break main_loop;
            default:
                alertar("Opção inválida");
                break;
        }
    }
}

function menu_agenda(consultorio) {
    main_loop: while (true) {
        exibir("Agenda");
        exibir("1 - Cadastrar consulta");
        exibir("2 - Cancelar agendamento");
        exibir("3 - Listar agenda");
        exibir("4 - Voltar para o menu principal");
        const opcao = pegar_dados("Opção: ");
        switch (opcao) {
            case "1":
                consultorio.agendar_consulta();
                break;
            case "2":
                consultorio.cancelar_consulta();
                break;
            case "3":
                consultorio.listar_agenda();
                break;
            case "4":
                exibir("Voltando...");
                break main_loop;
            default:
                alertar("Opção inválida");
                break;
        }
    }
}

main();
