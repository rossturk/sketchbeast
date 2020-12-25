all:
	rollup -c
deploy:
	scp -r public/* dreamy.rtrk.us:sketchbeast.com/
	curl -X POST "https://api.cloudflare.com/client/v4/zones/1b0fcba433437490cb748807951ec808/purge_cache" \
		-H "X-Auth-Email: ross@rossturk.com" \
		-H "X-Auth-Key: $(cat cloudflare.key)" \
		-H "Content-Type: application/json" \
		--data '{"purge_everything":true}'
