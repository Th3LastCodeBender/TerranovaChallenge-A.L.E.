#!/bin/bash
# Uso: install.sh [install|uninstall]
# Installa/rimuove il comando `commit` in ~/.local/bin.
# Il comando cerca commit.sh nella repo in cui ti trovi e lo lancia.
# Il ~/.bashrc viene toccato solo se ~/.local/bin non è nel PATH e
# l'utente accetta: in quel caso si lavora su una copia, la si verifica,
# si fa un backup e solo dopo si sovrascrive.

set -euo pipefail

BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
BASHRC="${BASHRC:-$HOME/.bashrc}"
TARGET="$BIN_DIR/commit"
TAG='# installato da commit script'
BEGIN='# >>> commit script >>>'
END='# <<< commit script <<<'
DIR=$(cd "$(dirname "$0")" && pwd)
ACTION="${1:-install}"

die() {
    echo "Errore: $*" >&2
    exit 1
}

# --- Modifica sicura del bashrc: $1 = contenuto del blocco ("" = rimuovi) ---
update_bashrc() {
    local block="$1" n_begin n_end l_begin l_end tmp backup i

    [[ -e "$BASHRC" ]] || touch "$BASHRC"
    [[ -f "$BASHRC" && -r "$BASHRC" && -w "$BASHRC" ]] || die "$BASHRC non è un file leggibile/scrivibile"

    n_begin=$(grep -cxF "$BEGIN" "$BASHRC" || true)
    n_end=$(grep -cxF "$END" "$BASHRC" || true)
    if [[ "$n_begin" != "$n_end" || "$n_begin" -gt 1 ]]; then
        die "marker 'commit script' incompleti o duplicati in $BASHRC, sistemali a mano (file non modificato)"
    fi
    if [[ "$n_begin" == 1 ]]; then
        l_begin=$(grep -nxF "$BEGIN" "$BASHRC" | cut -d: -f1)
        l_end=$(grep -nxF "$END" "$BASHRC" | cut -d: -f1)
        ((l_begin < l_end)) || die "marker 'commit script' in ordine sbagliato in $BASHRC (file non modificato)"
    fi

    tmp=$(mktemp)
    awk -v b="$BEGIN" -v e="$END" '
        $0 == b { skip = 1; next }
        $0 == e { skip = 0; next }
        !skip
    ' "$BASHRC" > "$tmp"
    [[ -n "$block" ]] && printf '%s\n%s\n%s\n' "$BEGIN" "$block" "$END" >> "$tmp"

    if bash -n "$BASHRC" 2>/dev/null && ! bash -n "$tmp"; then
        rm -f "$tmp"
        die "il nuovo bashrc avrebbe errori di sintassi (file non modificato)"
    fi
    if cmp -s "$tmp" "$BASHRC"; then
        rm -f "$tmp"
        return
    fi

    backup="$BASHRC.bak.$(date +%Y%m%d-%H%M%S)"
    i=1
    while [[ -e "$backup" ]]; do
        backup="$BASHRC.bak.$(date +%Y%m%d-%H%M%S).$i"
        i=$((i + 1))
    done
    cp -p "$BASHRC" "$backup" && cmp -s "$BASHRC" "$backup" \
        || { rm -f "$tmp"; die "impossibile creare il backup (file non modificato)"; }
    # cat > preserva symlink e permessi
    cat "$tmp" > "$BASHRC"
    rm -f "$tmp"
    echo "$BASHRC aggiornato, backup in $backup"
}

# Il file in $TARGET è stato installato da noi?
is_ours() {
    [[ -f "$TARGET" ]] && grep -qxF "$TAG" "$TARGET"
}

install() {
    local script_path tmp answer

    script_path="$(git -C "$DIR" rev-parse --show-prefix 2>/dev/null)" \
        || die "$DIR non è dentro una repo git"
    script_path+="commit.sh"
    chmod +x "$DIR/commit.sh"

    if [[ -e "$TARGET" ]] && ! is_ours; then
        die "$TARGET esiste già e non è stato installato da questo script, non lo sovrascrivo"
    fi

    mkdir -p "$BIN_DIR"
    tmp=$(mktemp "$BIN_DIR/.commit.XXXXXX")
    cat > "$tmp" <<EOF
#!/bin/bash
$TAG
root=\$(git rev-parse --show-toplevel 2>/dev/null) || { echo "Non sei in una repo git."; exit 1; }
if [[ -f "\$root/$script_path" ]]; then
    exec bash "\$root/$script_path" "\$@"
fi
echo "$script_path non trovato in \$root"
exit 1
EOF
    chmod 755 "$tmp"
    mv -f "$tmp" "$TARGET"
    echo "Comando 'commit' installato in $TARGET."

    if [[ ":$PATH:" == *":$BIN_DIR:"* ]]; then
        # Un altro eseguibile 'commit' che viene prima nel PATH?
        local found
        found=$(type -P commit || true)
        if [[ -n "$found" && "$found" != "$TARGET" ]]; then
            echo "Attenzione: $found viene prima nel PATH e avrà la precedenza."
        fi
        echo "Pronto: puoi usare 'commit' da subito."
        return
    fi

    echo "$BIN_DIR non è nel tuo PATH."
    read -rp "Lo aggiungo al $BASHRC (con backup)? (y/n): " answer
    if [[ "$answer" == [yY] ]]; then
        update_bashrc "export PATH=\"$BIN_DIR:\$PATH\""
        echo "Apri un nuovo terminale (o lancia 'source $BASHRC') per usare 'commit'."
    else
        echo "Aggiungi $BIN_DIR al PATH a mano per usare 'commit'."
    fi
}

uninstall() {
    if is_ours; then
        rm -f "$TARGET"
        echo "Comando 'commit' rimosso da $TARGET."
    elif [[ -e "$TARGET" ]]; then
        echo "$TARGET non è stato installato da questo script, lo lascio dov'è."
    else
        echo "Comando 'commit' non installato."
    fi
    if grep -qxF "$BEGIN" "$BASHRC" 2>/dev/null; then
        update_bashrc ""
    fi
}

case "$ACTION" in
    install) install ;;
    uninstall) uninstall ;;
    *) die "azione sconosciuta '$ACTION' (usa install o uninstall)" ;;
esac
