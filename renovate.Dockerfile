#-------------------------
# renovate rebuild trigger
#-------------------------

# makes lint happy
FROM scratch


# renovate: datasource=docker depName=python versioning=docker
ENV PYTHON_VERSION=3.9.2


# rebuild trigger
# renovate: datasource=docker depName=python versioning=docker
ENV PYTHON_VERSION=3.9.2
