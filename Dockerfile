# renovate: datasource=docker depName=renovate/ubuntu versioning=docker
ARG UBUNTU_VERSION=18.04


#--------------------------------------
# base image
#--------------------------------------
FROM renovate/ubuntu:${UBUNTU_VERSION} as build

USER root

COPY --from=renovate/buildpack:2@sha256:8b26457c4f06a8e7c490d01e37c14feaad9cc28f84b50dd1001dd1e337801e34 /usr/local/build /usr/local/build
COPY --from=renovate/buildpack:2@sha256:8b26457c4f06a8e7c490d01e37c14feaad9cc28f84b50dd1001dd1e337801e34 /usr/local/bin /usr/local/bin

# loading env
ENV BASH_ENV=/usr/local/etc/env
SHELL ["/bin/bash" , "-c"]

ENTRYPOINT [ "docker-entrypoint.sh", "python-build" ]

RUN install-apt \
  build-essential \
  dumb-init \
  libbz2-dev \
  libffi-dev \
  liblzma-dev \
  libreadline-dev \
  libsqlite3-dev \
  libssl-dev \
  zlib1g-dev \
  ;

RUN set -ex; \
  git clone https://github.com/pyenv/pyenv.git; \
  pushd pyenv/plugins/python-build; \
  ./install.sh; \
  popd; \
  rm -rf pyenv;

# rebuild trigger
# renovate: datasource=docker depName=python versioning=docker
ENV PYTHON_VERSION=3.7.7
