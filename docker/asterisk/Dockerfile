# ============================================
# Asterisk 16 - Sistema de Monitoreo VoIP
# ============================================
# Debian Bullseye ships Asterisk 16.2.x with chan_sip support
#
# Build:  docker compose build asterisk
# Shell:  docker compose exec asterisk asterisk -rx "core show version"
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

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5060/udp 5060/tcp 5038

ENTRYPOINT ["/docker-entrypoint.sh"]
