FROM node:16-bullseye

ARG TARGETARCH

ARG FFMPEG_VERSION=4.4.1
# Install FFMPEG
COPY ./bin/ffmpeg-${FFMPEG_VERSION}-${TARGETARCH}-static.tar.xz /tmp/ffmpeg/
RUN cd /tmp/ffmpeg && \
    tar -xvf ffmpeg-${FFMPEG_VERSION}-${TARGETARCH}-static.tar.xz && \
    cp ./ffmpeg-${FFMPEG_VERSION}-${TARGETARCH}-static/ffmpeg /usr/local/bin/ffmpeg && \
    cp ./ffmpeg-${FFMPEG_VERSION}-${TARGETARCH}-static/ffprobe /usr/local/bin/ffprobe && \
    rm -r /tmp/ffmpeg


WORKDIR /app

COPY . .

RUN npm install && npm run build

CMD ["npm","run","start"]