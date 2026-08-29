import { BookOpen, ShieldCheck, HeartHandshake, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";

const Wiki = () => {
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
                outras instituições. Ele pode consultar o histórico completo (para fins de
                acompanhamento e aprendizado), mas só pode responder/corrigir as fiscalizações
                ativas atribuídas a ele.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              Ainda com dúvidas?
            </CardTitle>
            <CardDescription>
              Fale com o fiscal responsável pela sua instituição ou com o administrador do sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Wiki;
