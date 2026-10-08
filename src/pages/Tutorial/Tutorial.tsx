import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import { useUserStore } from "@/stores/userStore";
import type { UserRole } from "@/@types/User";

interface Step {
  title: string;
  description: string;
  // Atalho para a tela citada no passo
  link?: { label: string; path: string };
}

interface RoleGuide {
  label: string;
  intro: string;
  steps: Step[];
}

// Passo a passo do sistema por perfil (v3). Os atalhos só funcionam para o
// perfil logado; os demais roteiros ficam visíveis para quem orienta colegas.
const GUIDES: Record<UserRole, RoleGuide> = {
  RT: {
    label: "Responsável Técnico",
    intro: "Do recebimento das notificações ao encerramento da fiscalização.",
    steps: [
      {
        title: "Entre com e-mail ou CPF",
        description:
          "Use o e-mail ou o CPF cadastrado pelo Coren. No primeiro acesso, troque a senha temporária. Se a sua CRT estiver vencida, o acesso fica bloqueado até a renovação — você é avisado 30 dias antes.",
      },
      {
        title: "Acompanhe o painel",
        description:
          "A fiscalização aparece para você depois que o fiscal faz a visita, preenche o checklist e envia. O painel mostra as fiscalizações em que você é o RT e o quadro “Prazos das notificações”, do mais urgente ao mais distante: vermelho = vencido, laranja = até 3 dias, amarelo = até 7 dias, verde = no prazo.",
        link: { label: "Ir para o painel", path: "/dashboard/rt" },
      },
      {
        title: "Responda cada notificação",
        description:
          "Abra a fiscalização marcada como “Correção Necessária”. Em cada item não conforme, descreva a correção e anexe a evidência (foto, PDF). O item passa para “Em análise pelo fiscal”, que é avisado na hora.",
      },
      {
        title: "Veja o que falta para encerrar",
        description:
          "No topo da fiscalização aparece quantos itens ainda aguardam a sua correção e quantos estão em análise pelo fiscal. Quando o fiscal aprova ou devolve um item, você recebe uma notificação.",
      },
      {
        title: "Tire dúvidas com o fiscal",
        description:
          "Dentro de uma fiscalização, use o painel de notas de cada categoria. Para assuntos gerais, abra um chamado: é um canal direto com os fiscais que já enviaram uma fiscalização da sua instituição.",
        link: { label: "Abrir chamados", path: "/chamados" },
      },
      {
        title: "Mantenha os documentos da instituição em dia",
        description:
          "Envie regimento interno, dimensionamento de pessoal, PRS, protocolos e escalas, com a data de validade. O fiscal acompanha esses documentos sem precisar pedir por e-mail.",
        link: { label: "Documentos da instituição", path: "/documentos-instituicao" },
      },
      {
        title: "Consulte a biblioteca",
        description:
          "Legislação, manuais, instrumentos administrativos e modelos de documentos editáveis, separados por tema e com busca.",
        link: { label: "Abrir a biblioteca", path: "/biblioteca" },
      },
      {
        title: "Receba o desfecho",
        description:
          "Ao encerrar, o fiscal registra o desfecho (cumprida, não cumprida, encaminhada para conciliação ou para as medidas cabíveis), o parecer e os próximos passos. Você recebe tudo no sistema e por e-mail, e o desfecho aparece na própria fiscalização, no seu painel. O histórico da instituição reúne as fiscalizações concluídas com todos os itens conformes.",
        link: { label: "Histórico da instituição", path: "/rt/history" },
      },
    ],
  },
  INSPECTOR: {
    label: "Fiscal",
    intro: "Do agendamento ao encerramento com desfecho.",
    steps: [
      {
        title: "Agende e conduza a fiscalização",
        description:
          "Agende a visita, inicie a fiscalização e avalie cada item do checklist como conforme, não conforme (com justificativa) ou não aplicável. Se a instituição não tiver RT cadastrado, informe nome e COREN de quem acompanhou.",
        link: { label: "Agendar fiscalização", path: "/fiscal/schedule" },
      },
      {
        title: "Envie as notificações ao RT",
        description:
          "Ao finalizar o formulário, os prazos dos itens não conformes são calculados e o RT é avisado no sistema e por e-mail.",
      },
      {
        title: "Acompanhe prazos e respostas",
        description:
          "Na página de pendências, as instituições aparecem com os itens perto do prazo. Você recebe um aviso 3 dias antes do vencimento e outro quando o prazo vence sem resposta.",
        link: { label: "Pendências por instituição", path: "/dashboard/fiscal/pendencias" },
      },
      {
        title: "Analise as correções",
        description:
          "Para cada resposta do RT, aprove o item ou devolva com justificativa. Tudo fica no histórico do item.",
      },
      {
        title: "Encerre com desfecho",
        description:
          "Com nenhuma resposta aguardando análise, use “Encerrar Fiscalização”: escolha o desfecho, escreva o parecer final (com sugestões de melhoria) e, se as notificações não foram cumpridas, os próximos passos para o RT.",
      },
      {
        title: "Fale com o RT e veja os documentos",
        description:
          "Use os chamados para falar com o RT fora de uma fiscalização e consulte os documentos que a instituição mantém atualizados.",
        link: { label: "Documentos das instituições", path: "/documentos-instituicao" },
      },
    ],
  },
  LEGAL_REPRESENTATIVE: {
    label: "Representante Legal",
    intro: "Acesso somente leitura para acompanhar a instituição.",
    steps: [
      {
        title: "Entre com e-mail ou CPF",
        description: "Use as credenciais criadas pelo Coren e troque a senha temporária no primeiro acesso.",
      },
      {
        title: "Acompanhe o histórico da instituição",
        description:
          "Veja as fiscalizações enviadas à instituição, os itens apontados, as respostas do RT e o desfecho de cada processo. Você não pode alterar nada.",
        link: { label: "Histórico da instituição", path: "/rt/history" },
      },
      {
        title: "Consulte os documentos da instituição",
        description: "Veja os documentos que o RT mantém no sistema e as datas de validade de cada um.",
        link: { label: "Documentos da instituição", path: "/documentos-instituicao" },
      },
    ],
  },
  ADMIN: {
    label: "Administrador",
    intro: "Cadastros e manutenção dos conteúdos de apoio.",
    steps: [
      {
        title: "Cadastre instituições, fiscais e RTs",
        description:
          "No cadastro do RT, informe o CPF (para login) e o número e a validade da CRT. Sem CRT vigente, o RT não acessa o sistema.",
        link: { label: "Gerenciar RTs", path: "/admin/rts" },
      },
      {
        title: "Cadastre representantes legais",
        description: "O representante legal tem acesso somente leitura ao histórico e aos documentos da própria instituição.",
        link: { label: "Representantes legais", path: "/admin/representantes" },
      },
      {
        title: "Mantenha a biblioteca atualizada",
        description:
          "Publique legislação, manuais, instrumentos administrativos e modelos editáveis, por arquivo ou link, com palavras-chave para a busca.",
        link: { label: "Abrir a biblioteca", path: "/biblioteca" },
      },
    ],
  },
};

const ROLE_ORDER: UserRole[] = ["RT", "INSPECTOR", "LEGAL_REPRESENTATIVE", "ADMIN"];

const Tutorial = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const currentRole = user?.role ?? "RT";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="outline" size="icon" aria-label="Voltar" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <GraduationCap className="w-7 h-7 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tutorial</h1>
            <p className="text-muted-foreground mt-1">Passo a passo do IntegraCoren para cada perfil</p>
          </div>
        </div>

        <Tabs defaultValue={currentRole}>
          <TabsList className="flex flex-wrap h-auto mb-6">
            {ROLE_ORDER.map((role) => (
              <TabsTrigger key={role} value={role}>
                {GUIDES[role].label}
                {role === currentRole && " (você)"}
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLE_ORDER.map((role) => (
            <TabsContent key={role} value={role}>
              <p className="text-muted-foreground mb-4">{GUIDES[role].intro}</p>
              <ol className="space-y-4">
                {GUIDES[role].steps.map((step, index) => (
                  <li key={step.title}>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-3">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm shrink-0">
                            {index + 1}
                          </span>
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">{step.description}</CardDescription>
                        {step.link && role === currentRole && (
                          <Button
                            variant="link"
                            className="px-0 mt-1"
                            onClick={() => navigate(step.link!.path)}
                          >
                            {step.link.label} →
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Tutorial;
