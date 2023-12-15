# 🔍 FiscalizaJa Deputados
👋 Olá! Este é o repositório da API Rest do **FiscalizaJá Deputados**.

# 🙋‍♂️ A diferença começa aqui.
Eu sou Victor Reis David. Um jovem programador de 17 anos que visa fazer diferença no mundo contemporâneo.

Programação me tirou da depressão e abriu meus olhos. Hoje eu faço uso da mesma para abrir os olhos do mundo.

Este projeto foi desenvolvido com muito carinho para ser um pedacinho de contribuição para um futuro melhor para a nossa geração ❤

Não deixe que o "julgamento pela capa" te cegue! Este repositório tem um altíssimo valor para a sociedade brasileira. E seria uma honra ver forks aperfeiçoando e dando origem a novos produtos e ideias. Estão a vontade para clonar e fazerem suas versões modificadas, vai com tudo galera!

Só não apague o verdadeiro objetivo do FiscalizaJá...

# 🔓 A luta pela transparência!
Estamos na era da informação, é impressionante como algumas informações sobre o uso de recursos públicos são de difícil acesso. Não deveria ser assim. E nunca mais será! Pois o FiscalizaJá está aqui!

## 🕵️‍♂️ O que é o FiscalizaJá?
FiscalizaJá é um projeto livre e open source com objetivo de promover a transparência sobre o uso de recursos públicos por parte dos políticos brasileiros. O dinheiro usado é nosso **e é nossa obrigação monitorar cada centavo**.

# 🔧 Serviço Rest ao resgate!
O antigo FiscalizaJá usava diretamente o serviço rest do Dados Abertos da Câmara dos deputados. No entanto, há alguns problemas que atrapalhavam a usabilidade do site.

- Altas latências: Os servidores onde o site roda suas funções backend ficam longe do Brasil, ou seja, para fazer o "proxy" entre cliente e servidor, há uma alta latência devido a distância dos servidores, o que impacta diretamente na velocidade de resposta do site.
- Instabilidades: O serviço da câmara sofre com instabilidades frequentemente, que afetam diretamente o site!

Pensando em resolver esses problemas e abrir margem para fiscalização de outras áreas, **o FiscalizaJá evoluiu**!

Agora, com um serviço rest próprio para a versão de deputados, é garantido:

- Alta velocidade de resposta: Com um banco de dados otimizado e preparado especificamente para servir o site, nós contamos com velocidades de resposta incríveis.
- Alta disponibilidade: Agora, nós baixamos e mantemos nossos dados, o que quer dizer que mesmo se a câmara dos deputados enfrentar uma instabilidade em sua infraestrutura, **o FiscalizaJá continuará operacional**.
- Mais funcionalidades: Podemos manipular e filtrar os dados como quisermos, é possível obter o total gasto ao ano por um deputado em milissegundos, não em segundos! E diversas outras funcionalidades simples porém super úteis.

## 📦 Em busca do banco de dados perfeito.
Se nós vamos lidar com um grande volume de dados, é necessário um bom SGBD para isso. O escolhido foi o `PostgreSQL`, um dos "queridinhos"! Postgres é extremamente confiável, poderoso, seguro e veloz, sabemos que vai dar conta do conjunto de dados que tende a crescer rapidamente.

- Houve uma tentativa em empregar o novo turso (https://turso.tech), porém o mesmo se mostrou instável sob grandes volumes de dados e ainda não está devidamente preparado para produção. Tem ótimo potencial, mas ainda não é a hora!

## 🎲 Estrutura das tabelas
As tabelas seguem a mesma estrutura dos dados `.json` retornados da câmara, somente com algumas adições.

- Despesas têm um campo chamado `difId`, que recebe o valor de todas as chaves concatenado com um `-`. Ele é necessário para evitar duplicatas, já que por padrão, despesas não têm um ID único.
- Deputados tem seu id colocado em `idCamara`.

### 👀 Recomendações para mexer com os dados
- Se precisar fazer inserções em massa e quiser esperar menos tempo, apague os índices da tabela antes e crie depois da inserção!
    - Se os índices não forem recriados, um SELECT poderá levar mais de 7 segundos!
- Paciência. Algumas operações demoram alguns bons minutos em bancos de dados gigantes.

**É altamente recomendado que o arquivo `config.json` seja editado para se adaptar as limitações do seu hardware. Caso contrário, poderá enfrentar problemas de desempenho.**

## 🔑 Variáveis de ambiente
A aplicação requer algumas variáveis de ambiente para funcionar. Você pode criar um arquivo `.env` (apena faça isso localmente) ou definir no seu sistema operacional.

```bash
DATABASE_URL="postgres://postgres:should_have_strong_password@127.0.0.1:5432"
SECRET_TOKEN="token"
```

Esse é um exemplo de como é o arquivo `.env` no FiscalizaJá. Em produção, defina as variáveis diretamente no seu ambiente.

- `DATABASE_URL`: URL do banco de dados PostgreSQL que será usado. Você pode criar um na supabase se não tiver uma instância rodando.
- `SECRET_TOKEN`: Token secreto que protege as rotas `/adm`, recomendável que você gere um token aleatório de pelo menos 64 bytes. Se quiser desativar completamente o `/adm`, pode omitir o valor.

## ⏱ Cron jobs
Para atualizar diariamente as despesas, há um cronjob rodando em segundo plano.

O horário em que ele é executado está no `config.json`.

# 🤨 FiscalizaJá vs Dados Abertos
Embora o FiscalizaJá deputados serve os mesmos dados de deputados e despesas, há várias diferenças.

- **Estrutura dos dados**: Os dados retornados não têm o mesmo padrão.
- **Funcionalidades**: O FiscalizaJá tem mais funcionalidades, como o `/relatorios`, que alimenta a parte de relatorios do site.
- **FiscalizaJa serve o necessário**: Não servimos 100% dos dados de lá, somente deputados e suas despesas. Se precisar de blocos, proposicoes, etc, use o Dados Abertos.


Podemos ver que essa "comparação" não é para dizer quem é o melhor, e sim apontar as diferenças entre os dois e pontos que você precisa se atentar caso decida usar a API do FiscalizaJá deputados em algum projeto seu.

A API do FiscalizaJá deputados foi feita especificamente para as necessidades do site.

# 🚀 Selfhosting
O processo de selfhosting é muito simples porém há alguns cuidados que você deve tomar.

Antes de tudo, instale as dependências com `npm install` e, quando for rodar em produção, compile o typescript para javascript antes: `npx tsc` - Os arquivos compilados ficarão na pasta `/dist`. (já rodei um projeto em produção sem compilar com o TSC 💀).
Caso queira apenas testar, use `npx ts-node src/index.ts`, não há necessidade de compilar todo o diretório para esse caso.

## 👀 Para quem compilou...
Veja se o diretório `dist` contém uma pasta chamada "data". Em alguns casos o tsc não a cria no momento em que o código é compilado. Se não houver, crie uma pasta `data` dentro de `dist` com
```bash
mkdir data
```

## 💀 Carregando os dados
Na pasta `dataProcessors` existem dois arquivos: `deputies.ts` e `expenses.ts`.

`deputies.ts` pode ser rodado sem nenhuma preocupação, pois é rápido e leva menos de 1 segundo em condições boas de conexão.

`expenses.ts` precisa ficar atento a alguns detalhes:

- Todos os dados serão baixados diretamente do site do dados abertos da câmara dos deputados e ficarão na pasta `data`, recomendo manter no gitignore, você não vai querer que isso vá para o github.

Para atualizar despesas de TODOS OS ANOS (processo demorado), simplesmente rode diretamente o arquivo `src/dataProcessors/expenses`.
No entanto, você tem a opção de importar como módulo na aplicação e passar o único parâmetro `updateMode` como `true`, o que fará com que apenas o ano atual seja baixado e atualizado. Certifique-se de estar com a data correta no seu sistema.

O processo foi feito para ser rápido, porém consumir o mínimo de recursos, portanto, os dados são dividos em transações concorrentes, o que maximiza a capacidade de escrita do banco de dados e reduz a quantidade de porções acumuladas na memória ram pelo programa. No entanto, é recomendado que o arquivo `config.json` seja modificado de acordo com o seu hardware.

- `processors.expenses.concurrent_transactions` é o número de transações concorrentes que serão feitas. Defina um número equilibrado entre a carga para o seu sistema e para o seu banco de dados. Concorrência é bastante intensiva no uso de CPU.
- `processors.expenses.transaction_size` é o número de despesas incluidas nas operações de insert em cada transação. Números muito altos não significam maior velocidade, e quanto maior, mais despesas serão colocadas na memória. Balanceie o número de transações e de dados inseridos.

* O processo de toda forma é demorado, leva cerca de 10 a 30 minutos pois a quantidade de dados é muito grande. Eu também não sou especialista em big data, então peço ajuda da comunidade open source para aperfeiçoar esse código 🙏

# 👐 Contribuições
O projeto é totalmente aberto a contribuições, serão todas bem-vindas e contribuirão para a esperança de um dia o Brasil mudar.