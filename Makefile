all:
	rollup -c
deploy:
	scp -r public/* dreamy.rtrk.us:sketchbeast.com/
	curl -X POST "https://api.cloudflare.com/client/v4/zones/1b0fcba433437490cb748807951ec808/purge_cache" \
		-H "X-Auth-Email: ross@rossturk.com" \
		-H "X-Auth-Key: 7c07c9b126b5ccc228506f71acdcb608d0b55" \
		-H "Content-Type: application/json" \
		--data '{"purge_everything":true}'
