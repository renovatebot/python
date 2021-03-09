#--------------------------------------
# base image
#--------------------------------------
FROM renovate/buildpack:4@sha256:bc40fb3708fb004ecd8b3a4f9a91ecb790d84e26da0a50c5a003ee3b494cd64e as build


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
