

all:
	@echo "Re-generating the website from the sources"

	#01main
	@cp -r	src/html/01main/	docs/
	@cp		src/css/*		docs/

	@/geology/GabrielGodefroy/installed_soft/pandoc-2.2.1/bin/pandoc \
		-s		src/index.md \
		--css 	./style.css \
		-o 		docs/index.html	


clean :
	rm -rf docs/*

show : 
	python -m SimpleHTTPServer 8000  &
	firefox http://localhost:8000/index.html   
