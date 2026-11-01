import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

const POLICIES: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  privacidade: {
    title: 'Política de Privacidade',
    sections: [
      { heading: 'Coleta de dados', body: 'Coletamos apenas os dados necessários para processar seus pedidos: nome, e-mail, telefone, CPF (quando aplicável) e endereço de entrega. Seus dados são armazenados de forma segura e criptografada.' },
      { heading: 'Uso dos dados', body: 'Utilizamos suas informações exclusivamente para processamento de pedidos, comunicação sobre suas compras e, mediante consentimento, envio de novidades da marca.' },
      { heading: 'Compartilhamento', body: 'Não compartilhamos seus dados com terceiros, exceto quando necessário para o processamento do pedido (transportadoras e gateways de pagamento).' },
      { heading: 'Seus direitos (LGPD)', body: 'Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento, conforme a Lei Geral de Proteção de Dados. Entre em contato pelo e-mail da loja.' },
      { heading: 'Cookies', body: 'Utilizamos cookies essenciais para o funcionamento da loja. Cookies de analytics só são ativados com seu consentimento.' },
    ],
  },
  termos: {
    title: 'Termos de Uso',
    sections: [
      { heading: 'Aceitação', body: 'Ao navegar e utilizar esta loja, você concorda com estes termos. Caso não concorde, por favor não utilize a plataforma.' },
      { heading: 'Contas e cadastro', body: 'Você é responsável pela veracidade das informações fornecidas no cadastro e pela segurança de sua conta e senha.' },
      { heading: 'Pedidos', body: 'Todos os pedidos estão sujeitos à confirmação de estoque e pagamento. Reservamo-nos o direito de cancelar pedidos em caso de indisponibilidade de produto ou suspeita de fraude.' },
      { heading: 'Preços', body: 'Os preços exibidos são válidos enquanto durarem os estoques. Eventuais erros de preço serão comunicados antes do processamento.' },
      { heading: 'Propriedade intelectual', body: 'Todo o conteúdo da loja — imagens, textos, logotipo e design — é propriedade da TALYTA AMARAL e protegido por direitos autorais.' },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    sections: [
      { heading: 'O que são cookies', body: 'Cookies são pequenos arquivos de texto armazenados no seu navegador para melhorar sua experiência de navegação.' },
      { heading: 'Cookies essenciais', body: 'São necessários para o funcionamento básico da loja, como manter o carrinho e a sessão de login. Não podem ser desativados.' },
      { heading: 'Cookies de analytics', body: 'Nos ajudam a entender como você usa a loja para melhorá-la. Só são ativados com seu consentimento explícito.' },
      { heading: 'Gerenciamento', body: 'Você pode gerenciar ou excluir cookies nas configurações do seu navegador a qualquer momento.' },
    ],
  },
  entrega: {
    title: 'Política de Entrega',
    sections: [
      { heading: 'Abrangência', body: 'Entregamos para todo o Brasil. O prazo e valor do frete são calculados no checkout com base no seu CEP.' },
      { heading: 'Prazos', body: 'Os prazos estimados começam a contar após a confirmação do pagamento. Varia conforme a região, geralmente entre 3 e 10 dias úteis.' },
      { heading: 'Rastreamento', body: 'Assim que o pedido for enviado, o código de rastreio ficará disponível na sua conta, em "Meus pedidos".' },
      { heading: 'Falhas na entrega', body: 'Se houver tentativa de entrega sem sucesso, a transportadora fará nova tentativa. Caso o produto retorne ao remetente, entraremos em contato.' },
    ],
  },
  'trocas-devolucoes': {
    title: 'Trocas e Devoluções',
    sections: [
      { heading: 'Prazo', body: 'Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.' },
      { heading: 'Condições', body: 'A peça deve estar sem uso, com etiqueta e em sua embalagem original. Produtos sem etiqueta ou com sinais de uso não serão aceitos.' },
      { heading: 'Como solicitar', body: 'Entre em contato via WhatsApp ou e-mail informando o número do pedido e o motivo. Enviaremos as instruções de envio.' },
      { heading: 'Reembolso', body: 'O reembolso é processado após o recebimento e verificação da peça, no mesmo método de pagamento original, em até 7 dias úteis.' },
      { heading: 'Troca de tamanho', body: 'Para troca de tamanho, o frete de retorno é por conta da cliente. A nova peça será enviada sem custo adicional de frete.' },
    ],
  },
  pagamento: {
    title: 'Formas de Pagamento',
    sections: [
      { heading: 'PIX', body: 'Aprovação imediata. Após a confirmação do pedido, você receberá o QR Code e o código copia e cola para pagamento.' },
      { heading: 'Cartão de crédito', body: 'Parcele em até 6x sem juros. A aprovação é processada pelo gateway de pagamento de forma segura e criptografada.' },
      { heading: 'Boleto bancário', body: 'O boleto tem vencimento em 3 dias. O pedido só é processado após a compensação, que pode levar até 3 dias úteis.' },
      { heading: 'Segurança', body: 'Não armazenamos dados de cartão. Toda a transação é processada pelo gateway de pagamento, em ambiente criptografado.' },
    ],
  },
};

export function PolicyPage() {
  const { policy } = useParams();
  const content = policy ? POLICIES[policy] : null;

  if (!content) {
    return (
      <div className="container-lg py-20 text-center">
        <p className="font-serif text-2xl">Página não encontrada</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={content.title} breadcrumb={[{ label: 'Início', to: '/' }, { label: content.title }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {content.sections.map((s, i) => (
            <div key={i}>
              <h2 className="font-serif text-xl">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
