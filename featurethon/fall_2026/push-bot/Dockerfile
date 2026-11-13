FROM oven/bun:1

WORKDIR /home/bun/app

COPY package.json bun.lock* ./
RUN bun install --production

COPY . .

ENV SCOREBOARD_PATH=/home/bun/app/data/scoreboard.json
EXPOSE 3000

CMD ["bun", "run", "index.ts"]
