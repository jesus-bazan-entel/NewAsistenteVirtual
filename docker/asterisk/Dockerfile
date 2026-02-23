# ============================================
# Asterisk 16 - Sistema de Monitoreo VoIP
# ============================================
# Debian Bullseye ships Asterisk 16 with chan_sip support.
# Bookworm removed Asterisk from repos and Asterisk 21+
# dropped chan_sip, so Bullseye is the right choice for
# legacy SIP gateway compatibility.
#
# Build:  docker compose -f docker/docker-compose.yml build asterisk
# Shell:  docker compose -f docker/docker-compose.yml exec asterisk asterisk -rx "core show version"
# ============================================

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    asterisk \
    asterisk-core-sounds-en \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/run/asterisk /var/log/asterisk /var/spool/asterisk/outgoing

# Copy base configuration
COPY manager.conf /etc/asterisk/manager.conf
COPY sip.conf /etc/asterisk/sip.conf
COPY extensions.conf /etc/asterisk/extensions.conf
COPY modules.conf /etc/asterisk/modules.conf

# Create empty monitoreo files (generated dynamically by backend)
RUN touch /etc/asterisk/sip.monitoreo.conf \
    && touch /etc/asterisk/extensions.monitoreo.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5060/udp 5060/tcp 5038

ENTRYPOINT ["/entrypoint.sh"]
