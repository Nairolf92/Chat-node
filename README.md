# Chat using Node/Express & Socket.io *(with data backup by Redis)*

## Intro

A small real time chat with rooms build with Node/Express using Redis.

**Redis** is required (storage of users and messages, IP included).

## Installation

`yarn install` to install dependencies.

Run node server with `yarn start` and follow instructions (server run on [http://localhost:3000](http://localhost:3000))

Uncomment on app.js or create it on redis 

 ``
 client.sadd("rooms", "informatique");
 ``
 
 ``
 client.sadd("rooms", "marketing");
 ``
