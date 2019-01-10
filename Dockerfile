FROM node:latest
LABEL "project.home"="https://github.com/nannal/avalon-account-creator"
RUN git clone git://github.com/nannal/avalon-account-creator
WORKDIR /avalon-account-creator
RUN npm install
EXPOSE 8080
ENV AVA_SENDER 'USER'
ENV AVA_KEY 'KEY'
ENV AVA_PORT '3001'
ENV AVA_ADDR 'LOCALHOST'
ENV PORT '8080'
ENV PEERS 'ws://api.avalon.wtf:6001,ws://avalon.nannal.com:6001,ws://82.66.109.22:6001'
CMD ["npm", "start"]
