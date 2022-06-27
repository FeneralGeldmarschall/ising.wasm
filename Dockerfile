FROM archlinux:latest

ENV TERM=xterm
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN pacman -Syy --noconfirm
RUN pacman -Syu	--noconfirm
RUN pacman -S --noconfirm \
	nodejs \
	git \
	cargo \
	rust \
	rustup \
	curl \
	which \
	npm

RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
RUN rustup install stable

RUN mkdir -p /home/root/ising-webcanvas
COPY . /home/root/ising-webcanvas
WORKDIR /home/root/ising-webcanvas
RUN wasm-pack build --release
WORKDIR /home/root/ising-webcanvas/www/
RUN npm install
RUN npm run build

CMD [ "npm", "run", "start" ]
