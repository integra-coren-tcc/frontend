import { useNavigate } from "react-router-dom";
import { BookOpen, ShieldCheck, HeartHandshake, HelpCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";

const Wiki = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ajuda &amp; Wiki</h1>
            <p className="text-muted-foreground mt-1">
              Dúvidas comuns sobre o processo de fiscalização e o papel do Responsável Técnico
            </p>
          </div>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartHandshake className="w-5 h-5 text-primary" />
              Por que muita gente hesita em ser RT — e por que não precisa
            </CardTitle>
            <CardDescription>
              É comum encontrar resistência de profissionais em assumir o papel de Responsável
              Técnico (RT) de uma instituição. Geralmente isso vem de informação incompleta sobre
              o que o cargo realmente exige. Esta página existe para esclarecer isso.
            </CardDescription>
          </CardHeader>
        </Card>

        <Accordion type="multiple" className="space-y-3">
          <AccordionItem value="o-que-e" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              O que é o Responsável Técnico (RT)?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                O RT é o profissional de enfermagem formalmente indicado perante o COREN como
                responsável pela supervisão técnica dos serviços de enfermagem de uma instituição
                de saúde (hospital, clínica, laboratório, etc.). É uma exigência legal — toda
                instituição que presta serviços de enfermagem precisa ter um RT registrado.
              </p>
              <p>
                Na prática, o RT é o ponto de contato entre a instituição e o COREN durante uma
                fiscalização: é ele quem recebe as não conformidades apontadas pelo fiscal e
                organiza a correção junto à equipe.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="responsabilidades" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              O que o RT realmente faz no dia a dia?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>Na rotina do sistema, o papel do RT é bem delimitado:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Acompanhar as fiscalizações da sua instituição pelo painel.</li>
                <li>
                  Quando um item é apontado como não conforme, enviar uma justificativa e as
                  evidências da correção (foto, documento) pelo próprio sistema.
                </li>
                <li>Tirar dúvidas com o fiscal diretamente por item, de forma informal, pelo chat interno.</li>
                <li>Consultar o histórico de fiscalizações anteriores da instituição.</li>
              </ul>
              <p>
                Não é uma rotina de trabalho extra diária — a demanda existe apenas quando há uma
                fiscalização em andamento ou uma correção pendente.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mitos" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              Mitos comuns sobre ser RT
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground">
                  "Se algo der errado na instituição, a culpa recai só sobre mim."
                </p>
                <p>
                  A responsabilidade técnica do RT se refere à supervisão dos aspectos técnicos de
                  enfermagem que estão sob sua alçada, não a tudo que acontece na instituição. A
                  responsabilidade é sempre proporcional ao que está de fato sob o controle e
                  conhecimento do profissional.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  "Vou ter que ficar disponível o tempo todo."
                </p>
                <p>
                  O acompanhamento das fiscalizações é feito de forma assíncrona pelo sistema —
                  não é necessário estar disponível em tempo integral, só responder dentro do
                  prazo de correção informado (calculado automaticamente por item).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  "É um cargo burocrático e difícil de entender."
                </p>
                <p>
                  O IntegraCoren foi feito para simplificar exatamente essa parte: o RT recebe
                  notificações claras sobre o que precisa ser corrigido, com prazo e instruções,
                  sem precisar entender processos administrativos complexos por fora do sistema.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sem-rt" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              A instituição ainda não tem um RT indicado — e agora?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                O agendamento de uma fiscalização não é bloqueado pela ausência de um RT
                cadastrado. Ao iniciar a fiscalização, o fiscal pode informar manualmente o nome e
                o número de registro no COREN da pessoa presente no momento, e a instituição pode
                formalizar o cadastro do RT junto ao COREN posteriormente.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="seguranca" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                O RT tem acesso a quê no sistema?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                O RT vê apenas as fiscalizações da instituição em que está alocado — nunca dados de
                outras instituições — e somente depois que o fiscal faz a visita, preenche o
                checklist e envia. Fiscalizações agendadas ou em andamento não aparecem. Ele pode consultar o histórico completo (para fins de
                acompanhamento e aprendizado), mas só pode responder/corrigir as fiscalizações
                ativas atribuídas a ele.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="glossario" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              Glossário: PAD, notificação, CRT, CIP e ART
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>PAD / PAD-F</strong> — o processo administrativo de fiscalização. No sistema,
                  cada fiscalização corresponde a um processo, do agendamento ao encerramento.
                </li>
                <li>
                  <strong>Notificação</strong> — cada exigência apontada pelo fiscal (item não conforme),
                  com um prazo para correção.
                </li>
                <li>
                  <strong>CRT</strong> — Certidão de Responsabilidade Técnica, que habilita o enfermeiro
                  como RT da instituição. Sem CRT vigente, o acesso do RT ao sistema é bloqueado.
                </li>
                <li>
                  <strong>CIP</strong> — Carteira de Identidade Profissional do profissional de enfermagem.
                </li>
                <li>
                  <strong>ART</strong> — Anotação de Responsabilidade Técnica, um dos itens verificados
                  no checklist.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="prazos" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              Como funcionam os prazos e os alertas?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Quando o fiscal envia as notificações, cada item não conforme recebe um prazo de
                correção. O RT e o fiscal são avisados no sistema (sino) e por e-mail:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>quando as notificações são enviadas ao RT;</li>
                <li>3 dias antes de cada prazo vencer;</li>
                <li>quando um prazo vence sem a correção;</li>
                <li>30 dias antes da CRT do RT vencer;</li>
                <li>quando a fiscalização é encerrada.</li>
              </ul>
              <p>
                No painel do RT, as cores indicam a urgência: vermelho = vencido, laranja = até 3 dias,
                amarelo = até 7 dias, verde = no prazo.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="desfecho" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              O que significa cada desfecho da fiscalização?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Notificações cumpridas</strong> — todas as exigências foram atendidas.</li>
                <li><strong>Notificações não cumpridas</strong> — as exigências não foram atendidas.</li>
                <li>
                  <strong>Encaminhada para conciliação</strong> — as medidas administrativas se
                  esgotaram e o caso segue para conciliação.
                </li>
                <li>
                  <strong>Encaminhada para as medidas cabíveis</strong> — o caso segue para as demais
                  medidas previstas pelo Sistema Cofen/Conselhos Regionais.
                </li>
              </ul>
              <p>
                Junto com o desfecho, o fiscal registra um parecer final com sugestões de melhoria e,
                quando as notificações não foram cumpridas, os próximos passos para o RT.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="canais" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              Onde falo com o fiscal e onde ficam os documentos?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Notas da fiscalização</strong> — dúvidas sobre uma categoria de itens,
                  dentro da própria fiscalização.
                </li>
                <li>
                  <strong>Chamados</strong> — canal direto com o fiscal para assuntos gerais, mesmo sem
                  fiscalização em andamento.
                </li>
                <li>
                  <strong>Documentos da instituição</strong> — regimento, dimensionamento, PRS,
                  protocolos e escalas, mantidos pelo RT para o fiscal acompanhar.
                </li>
                <li>
                  <strong>Biblioteca</strong> — legislação, manuais, instrumentos administrativos e
                  modelos de documentos editáveis, com busca por tema.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-primary" />
              Passo a passo do sistema
            </CardTitle>
            <CardDescription>
              O tutorial mostra, para cada perfil, como usar cada tela do IntegraCoren.
            </CardDescription>
            <div>
              <Button variant="outline" className="mt-2" onClick={() => navigate("/tutorial")}>
                Abrir o tutorial
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              Ainda com dúvidas?
            </CardTitle>
            <CardDescription>
              Abra um chamado com o fiscal responsável pela sua instituição ou fale com o administrador do sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Wiki;
