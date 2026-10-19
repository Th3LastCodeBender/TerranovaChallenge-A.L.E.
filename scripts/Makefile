# Lancia lo stesso target in ogni tool (ogni sottocartella con un Makefile).
# Uso: make [install|uninstall]            -> tutti i tool
#      make install TOOLS="commit"         -> solo i tool indicati

TOOLS ?= $(patsubst %/Makefile,%,$(wildcard */Makefile))
TARGETS := install uninstall

all: install

$(TARGETS):
	@for tool in $(TOOLS); do \
		echo "==> $$tool: $@"; \
		$(MAKE) --no-print-directory -C $$tool $@ || exit 1; \
	done

list:
	@echo $(TOOLS)

.PHONY: all list $(TARGETS)
