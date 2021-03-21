#!/bin/bash

set -e


echo "APT::Install-Recommends \"false\";" | tee -a /etc/apt/apt.conf.d/buildpack.conf
echo "APT::Get::Upgrade \"false\";" | tee -a /etc/apt/apt.conf.d/buildpack.conf
echo "APT::Get::Install-Suggests \"false\";" | tee -a /etc/apt/apt.conf.d/buildpack.conf


apt-get update
apt-get install -y \
  build-essential \
  ca-certificates \
  curl \
  dumb-init \
  git \
  libbz2-dev \
  libffi-dev \
  liblzma-dev \
  libreadline-dev \
  libsqlite3-dev \
  libssl-dev \
  zlib1g-dev \
  ;

git clone https://github.com/pyenv/pyenv.git
pushd pyenv/plugins/python-build
./install.sh
popd

mkdir -p /usr/local/python /cache
