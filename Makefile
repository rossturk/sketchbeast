all:
	rollup -c
deploy:
	scp -r public/* dreamy.rtrk.us:sketchbeast.com/
