#!/bin/bash
pacman -Syu --needed --noconfirm nodejs npm
pacman -Sd --noconfirm gcc gcc-libs
npm install
