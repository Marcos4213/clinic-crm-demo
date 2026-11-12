# Áudios da apresentação

A página procura os arquivos sozinha. A duração de cada parte é lida do MP3.

## Mensagem do Marcos

O player toca só os arquivos listados em `MARCOS_PARTS`, em `apresentacao/config.js`. Hoje a lista tem um arquivo:

- `apresentacao/audio/marcos-1.mp3`

A duração mostrada é a do próprio MP3. Para trocar a gravação, substitua esse arquivo e aumente `MARCOS_AUDIO_VERSION` no mesmo config, para o navegador não reaproveitar o áudio antigo.

Foto opcional: `marcos.jpg`, `marcos.webp` ou `marcos.png`. Sem foto, aparecem as iniciais M.

## Áudio do paciente

Um arquivo por nicho. A bolha mostra a duração real e a transcrição. Se o arquivo sair da pasta, o play fica desativado e a transcrição continua visível.

- `paciente-implantes.mp3`
- `paciente-lentes.mp3`
- `paciente-harmonizacao.mp3`
- `paciente-plastica.mp3`
- `paciente-dermato.mp3`
