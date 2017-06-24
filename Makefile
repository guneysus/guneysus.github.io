default: watch

clean:
	@rm dist/* -rf

build: clean
	@npm run build

watch: clean
	@npm run watch	

serve: clean
	@npm run serve

.PHONY: default clean build watch start
