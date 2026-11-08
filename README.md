# Clinic CRM

Demonstração frontend de CRM para clínicas — React e Tailwind. Apenas dados fictícios.

Projeto novo, separado do repositório de método [superpowers](https://github.com/Marcos4213/superpowers). Aquele repositório ensina o processo (especificação, plano, teste antes do código). Este repositório é o produto.

Demonstração estática, só de frontend, de um CRM comercial para clínicas brasileiras. O funil, a conversa e os relatórios usam leads fictícios carregados no navegador. Nenhuma mensagem é enviada, nenhuma campanha é criada e não há WhatsApp, Supabase ou outro serviço conectado.

O nome **Clinic CRM** é temporário.

## Requisitos

- Node.js 22
- npm 10

## Local

```bash
npm install
npm run dev
```

Abra o endereço que o Vite imprimir. A aplicação usa rotas com hash (`#/`, `#/disparos`, `#/ia`, `#/relatorios`), então o mesmo `index.html` atende todos os caminhos.

```bash
npm test
npm run lint
npm run build
npm run preview
```

O build sai em `dist/` com `base` relativo (`./`). Para forçar um subcaminho:

```bash
VITE_BASE_PATH=/nome-do-repositorio/ npm run build
```

Use `/` só em um site de usuário ou organização (`https://usuario.github.io/`). Em um project site (`https://usuario.github.io/nome-do-repositorio/`), use `/nome-do-repositorio/` ou mantenha o padrão `./`.

## GitHub Pages

Este repositório público, [Marcos4213/clinic-crm-demo](https://github.com/Marcos4213/clinic-crm-demo), é o endereço exclusivo do produto. O arquivo `.github/workflows/pages.yml` publica o site no push da branch `main`: instala, testa, gera `dist/` e envia o artefato com `actions/deploy-pages`.

A primeira publicação depende de duas opções que só um administrador do repositório pode gravar:

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
2. **Settings → Actions → General:** permitir Actions neste repositório.

Quando esse workflow termina com sucesso, o site fica em `https://marcos4213.github.io/clinic-crm-demo/#/`. As rotas continuam no hash (`#/disparos`, `#/ia`, `#/relatorios`) e os assets usam `base` relativo (`./`).
