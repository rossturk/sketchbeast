all:
	rollup -c
deploy:
	pushd public
	scp -r * dreamy.rtrk.us:sketchbeast.com/
	popd
