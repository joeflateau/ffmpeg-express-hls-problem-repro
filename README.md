## To run repro

```shell
docker build -t ffmpeg-express-hls-prob . && docker run -it --rm ffmpeg-express-hls-prob
```

- Option 1 will use pipe/pipeline alone to write a temp file
- Option 2 will copy req to a passthrough and then pipe/pipeline that passthrough to write a temp file
