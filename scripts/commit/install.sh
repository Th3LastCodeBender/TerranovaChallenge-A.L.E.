#!/bin/bash
# Uso: install.sh [install|uninstall]
# Installa/rimuove il comando `commit` in ~/.local/bin.
# Il comando cerca commit.sh nella repo in cui ti trovi e lo lancia.
# ~/.bashrc e ~/.zshrc vengono toccati solo se ~/.local/bin manca dalla
# configurazione di quella shell e l'utente accetta: in quel caso si lavora
# su una copia, la si verifica, si fa un backup e solo dopo si sovrascrive.

set -euo pipefail

BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
BASHRC="${BASHRC:-$HOME/.bashrc}"
ZDOTDIR="${ZDOTDIR:-$HOME}"
ZSHRC="${ZSHRC:-$ZDOTDIR/.zshrc}"
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

# --- Modifica sicura di un file di configurazione: $1 = file, $2 = contenuto del blocco ("" = rimuovi) ---
update_rc() {
    local rc="$1" block="$2" sh=bash n_begin n_end l_begin l_end tmp backup i

    [[ "$rc" == "$ZSHRC" ]] && sh=zsh

    [[ -e "$rc" ]] || touch "$rc"
    [[ -f "$rc" && -r "$rc" && -w "$rc" ]] || die "$rc non è un file leggibile/scrivibile"

    n_begin=$(grep -cxF "$BEGIN" "$rc" || true)
    n_end=$(grep -cxF "$END" "$rc" || true)
    if [[ "$n_begin" != "$n_end" || "$n_begin" -gt 1 ]]; then
        die "marker 'commit script' incompleti o duplicati in $rc, sistemali a mano (file non modificato)"
    fi
    if [[ "$n_begin" == 1 ]]; then
        l_begin=$(grep -nxF "$BEGIN" "$rc" | cut -d: -f1)
        l_end=$(grep -nxF "$END" "$rc" | cut -d: -f1)
        ((l_begin < l_end)) || die "marker 'commit script' in ordine sbagliato in $rc (file non modificato)"
    fi

    tmp=$(mktemp)
    awk -v b="$BEGIN" -v e="$END" '
        $0 == b { skip = 1; next }
        $0 == e { skip = 0; next }
        !skip
    ' "$rc" > "$tmp"
    [[ -n "$block" ]] && printf '%s\n%s\n%s\n' "$BEGIN" "$block" "$END" >> "$tmp"

    if "$sh" -n "$rc" 2>/dev/null && ! "$sh" -n "$tmp"; then
        rm -f "$tmp"
        die "il nuovo $rc avrebbe errori di sintassi (file non modificato)"
    fi
    if cmp -s "$tmp" "$rc"; then
        rm -f "$tmp"
        return
    fi

    backup="$rc.bak.$(date +%Y%m%d-%H%M%S)"
    i=1
    while [[ -e "$backup" ]]; do
        backup="$rc.bak.$(date +%Y%m%d-%H%M%S).$i"
        i=$((i + 1))
    done
    cp -p "$rc" "$backup" && cmp -s "$rc" "$backup" \
        || { rm -f "$tmp"; die "impossibile creare il backup (file non modificato)"; }
    # cat > preserva symlink e permessi
    cat "$tmp" > "$rc"
    rm -f "$tmp"
    echo "$rc aggiornato, backup in $backup"
}

# Uno dei file $@ aggiunge già $BIN_DIR al PATH?
rc_has_path() {
    local file
    for file in "$@"; do
        [[ -f "$file" ]] || continue
        awk -v a="$BIN_DIR" -v b="\$HOME${BIN_DIR#"$HOME"}" '
            !/^[[:space:]]*#/ && (index($0, a) || index($0, b)) { found = 1 }
            END { exit !found }
        ' "$file" && return 0
    done
    return 1
}

# Propone di aggiungere $BIN_DIR al PATH nel file $1.
offer_path() {
    local rc="$1" answer
    read -rp "$BIN_DIR non è nella configurazione di $(basename "$rc"). Lo aggiungo a $rc (con backup)? (y/n): " answer
    if [[ "$answer" == [yY] ]]; then
        update_rc "$rc" "export PATH=\"$BIN_DIR:\$PATH\""
        echo "Apri un nuovo terminale (o lancia 'source $rc') per usare 'commit'."
    else
        echo "Aggiungi $BIN_DIR al PATH in $rc a mano per usare 'commit' da quella shell."
    fi
}

# Il file in $TARGET è stato installato da noi?
is_ours() {
    [[ -f "$TARGET" ]] && grep -qxF "$TAG" "$TARGET"
}

install() {
    local script_path tmp

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

    local in_path=0
    if [[ ":$PATH:" == *":$BIN_DIR:"* ]]; then
        in_path=1
        # Un altro eseguibile 'commit' che viene prima nel PATH?
        local found
        found=$(type -P commit || true)
        if [[ -n "$found" && "$found" != "$TARGET" ]]; then
            echo "Attenzione: $found viene prima nel PATH e avrà la precedenza."
        fi
        echo "Pronto: puoi usare 'commit' da subito."
    fi

    # Il PATH attuale può essere ereditato: zsh non legge i file di bash, quindi va controllata a parte.
    if ((in_path == 0)) && ! rc_has_path "$BASHRC" "$HOME/.profile" "$HOME/.bash_profile"; then
        offer_path "$BASHRC"
    fi
    if command -v zsh >/dev/null && ! rc_has_path "$ZSHRC" "$ZDOTDIR/.zshenv" "$ZDOTDIR/.zprofile"; then
        offer_path "$ZSHRC"
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
    local rc
    for rc in "$BASHRC" "$ZSHRC"; do
        if grep -qxF "$BEGIN" "$rc" 2>/dev/null; then
            update_rc "$rc" ""
        fi
    done
}

case "$ACTION" in
    install) install ;;
    uninstall) uninstall ;;
    *) die "azione sconosciuta '$ACTION' (usa install o uninstall)" ;;
esac
