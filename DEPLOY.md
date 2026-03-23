# Deploy SabiduS

## 1. Preparar o GitHub

1. Crie um repositorio no GitHub ou use o que ja existe.
2. Envie este projeto para a branch principal.
3. Confirme que os arquivos `render.yaml`, `server/package.json`, `eas.json` e `app.json` estao no repositorio.

## 2. Publicar a API no Render

1. Acesse o painel do Render e conecte sua conta do GitHub.
2. Clique em `New` -> `Blueprint`.
3. Selecione este repositorio.
4. O Render vai detectar o arquivo `render.yaml` na raiz.
5. Revise o servico `sabidus-api` e confirme a criacao.
6. No servico criado, abra `Environment`.
7. Defina a variavel `GEMINI_API_KEY` com a sua chave real.
8. Salve com a opcao de rebuild e deploy.
9. Ao fim do deploy, copie a URL publica do Render, por exemplo `https://sabidus-api.onrender.com`.
10. Teste no navegador `https://sabidus-api.onrender.com/api/health`.

## 3. Configurar a URL publica no app

1. Entre com sua conta Expo:

```powershell
npx eas-cli login
```

2. Crie a variavel publica no ambiente `production`:

```powershell
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value https://sabidus-api.onrender.com --environment production --visibility plaintext
```

3. Crie a mesma variavel no ambiente `preview`:

```powershell
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value https://sabidus-api.onrender.com --environment preview --visibility plaintext
```

4. Para publicar a web com a URL correta no bundle, puxe o ambiente `production` para o `.env.local`:

```powershell
npx eas-cli env:pull --environment production
```

5. O arquivo local ficara com este valor:

```env
EXPO_PUBLIC_API_BASE_URL=https://sabidus-api.onrender.com
```

6. Se quiser continuar usando API local no dia a dia, depois voce pode restaurar o `.env.local` manualmente.

## 4. Publicar a versao web

1. Se ainda nao vinculou o projeto ao Expo:

```powershell
npx eas-cli init
```

3. Gere os arquivos web:

```powershell
npm run export:web
```

4. Publique a web:

```powershell
npm run deploy:web
```

5. O Expo vai devolver a URL publica da web no final do processo.

## 5. Gerar o APK Android

1. Garanta que `EXPO_PUBLIC_API_BASE_URL` aponta para a URL publica do Render.
2. Gere o APK:

```powershell
npm run build:apk
```

3. No primeiro build, o EAS pode pedir login, vinculacao do projeto e credenciais Android.
4. Quando o build terminar, baixe o arquivo `.apk`.
5. Instale no aparelho por cabo, Drive, WhatsApp ou outro meio.

## 6. Fluxo de manutencao

1. Mudou a API: envie para o GitHub e o Render faz novo deploy.
2. Mudou o app web: rode `npm run export:web` e depois `npm run deploy:web`.
3. Mudou o app mobile: rode `npm run build:apk` para gerar um novo instalador.

## Observacoes

- O arquivo `app.json` ja esta com `expo.web.output` em `static`, que e exigido para `eas deploy`.
- O backend ja escuta em `0.0.0.0`, compativel com Render.
- Sem URL publica, o APK instalado fora do seu computador nao consegue falar com `localhost`.
