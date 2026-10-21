ARG BASE_IMAGE
FROM ${BASE_IMAGE}
# Deliberate failed-release fixture for the local rollback lesson.
CMD ["node","-e","process.exit(42)"]
