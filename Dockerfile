FROM archlinux:latest

ENV DEBIAN_FRONTEND noninteractive
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

#RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs >> rustup.sh
#RUN sh rustup.sh -y
#RUN rm rustup.sh
#RUN source $HOME/.cargo/env
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
RUN rustup install stable

RUN mkdir -p /home/root/ising-webcanvas
COPY . /home/root/ising-webcanvas
#WORKDIR /home/root
#RUN git clone https://gitlab.com/Justus557/ising-webcanvas.git
WORKDIR /home/root/ising-webcanvas
RUN wasm-pack build --release
WORKDIR /home/root/ising-webcanvas/www/
RUN npm install
RUN npm run build

CMD [ "npm", "run", "start" ]
