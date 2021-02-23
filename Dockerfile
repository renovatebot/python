#--------------------------------------
# base image
#--------------------------------------
FROM renovate/buildpack:4@sha256:4ed029be823f6606092730f89ec488b78d8861d9f8c2ef67e1f60834d176258f as build


# build target, name required by binary-builder
ARG FLAVOR
RUN . /etc/os-release; [ "${VERSION_CODENAME}" == "${FLAVOR}" ] || exit 55


ENTRYPOINT [ "docker-entrypoint.sh", "builder.sh" ]


RUN install-apt \
  build-essential \
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

COPY bin /usr/local/bin
