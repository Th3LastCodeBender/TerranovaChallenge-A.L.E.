#!/bin/bash
# Uso: commit [KEYWORD [STATO]] [file ...]
#   KEYWORD e STATO sono i numeri dei menu (es. "commit 1 3" o "commit 13" = FEATURE: WORK IN PROGRESS)
#   anche al prompt della keyword si può scrivere "13" o "1 3"
#   senza file -> git add -A (tutta la repo)
#   con file   -> git add solo dei file indicati
#   commit --add -> aggiunge una nuova keyword o un nuovo stato (salvati in questo script)
# Formato commit: "KEYWORD[: STATO] | messaggio | file1, file2, file3..."

# Blocco riscritto da "commit --add": si può modificare anche a mano, ma lascia i marker.
# Una keyword ha degli stati se esiste l'array <KEYWORD>_STATES.
# >>> keyword >>>
KEYWORDS=("FEATURE" "BUG" "REFACTORING" "CLEANING" "PERFORMANCE" "TEST" "WORKFLOW" "MERGE")
FEATURE_STATES=("NEW" "UPDATE" "WORK IN PROGRESS" "DONE")
BUG_STATES=("FOUND" "FIX IN PROGRESS" "SOLVED")
# <<< keyword <<<

# I codici combinati (es. 13) usano una cifra per la keyword e una per lo stato
MAX_ITEMS=9
KEYWORD_PATTERN='^[A-Z][A-Z0-9_]*$'
STATE_PATTERN='^[A-Z][A-Z0-9 _-]*$'

die() {
    echo "$*" >&2
    exit 1
}

# La keyword $1 ha almeno uno stato?
has_states() {
    declare -p "$1_STATES" >/dev/null 2>&1 || return 1
    local -n _st="$1_STATES"
    ((${#_st[@]} > 0))
}

# $1 è tra gli argomenti successivi?
contains() {
    local needle="$1" i
    shift
    for i in "$@"; do
        [[ "$i" == "$needle" ]] && return 0
    done
    return 1
}

# Cerca $1 (numero o nome, case insensitive) tra le opzioni e salva il risultato in $CHOICE.
match() {
    local input="${1^^}" i
    shift
    local options=("$@")
    if [[ "$input" =~ ^[0-9]+$ ]] && ((input >= 1 && input <= ${#options[@]})); then
        CHOICE="${options[input - 1]}"
        return 0
    fi
    for i in "${options[@]}"; do
        if [[ "$input" == "$i" ]]; then
            CHOICE="$i"
            return 0
        fi
    done
    return 1
}

# Stampa le opzioni numerate; quelle con degli stati (es. FEATURE_STATES)
# vengono mostrate ad albero col codice combinato (es. 13).
show_menu() {
    local options=("$@") i j branch
    for i in "${!options[@]}"; do
        printf "%d) %s\n" $((i + 1)) "${options[i]}"
        if has_states "${options[i]}"; then
            local -n states="${options[i]}_STATES"
            for j in "${!states[@]}"; do
                branch="├─"
                ((j == ${#states[@]} - 1)) && branch="└─"
                printf "   %s %d%d) %s\n" "$branch" $((i + 1)) $((j + 1)) "${states[j]}"
            done
            unset -n states
        fi
    done
}

# Mostra un menu numerato e salva la scelta in $CHOICE.
# Se $2 non è vuoto viene usato come scelta, senza mostrare il menu.
pick() {
    local prompt="$1" preset="$2" input
    shift 2
    local options=("$@")
    if [[ -n "$preset" ]]; then
        match "$preset" "${options[@]}" && return
        die "$prompt non valido: $preset"
    fi
    echo "$prompt:"
    echo
    show_menu "${options[@]}"
    echo
    while true; do
        read -rp "$prompt: " input || exit 1
        # Con SPLIT=1 accetta anche "13" o "1 3": la seconda cifra finisce in $NEXT_PRESET
        NEXT_PRESET=""
        if [[ -n "$SPLIT" && "$input" =~ ^([0-9])\ *([0-9])$ ]]; then
            input="${BASH_REMATCH[1]}"
            NEXT_PRESET="${BASH_REMATCH[2]}"
        fi
        match "$input" "${options[@]}" && return
        echo "Non posso ne scendere ne salire, NE SCENDERE E NE SALIRE (Scelta non valida.)"
    done
}

# --- Modalità --add ---

# Legge un nome (maiuscolo, spazi normalizzati) valido per la regex $2 e lo salva in $NAME.
# Ritorna 1 se l'utente preme invio a vuoto.
read_name() {
    local prompt="$1" pattern="$2" input words
    while true; do
        read -rp "$prompt" input || return 1
        read -ra words <<< "${input^^}"
        NAME="${words[*]}"
        [[ -z "$NAME" ]] && return 1
        [[ "$NAME" =~ $pattern ]] && return 0
        if [[ "$pattern" == "$KEYWORD_PATTERN" ]]; then
            echo "Questo nome non lo pronuncerebbe neanche Gandalf (Solo lettere, cifre e _, deve iniziare con una lettera.)"
        else
            echo "Questo nome non lo pronuncerebbe neanche Gandalf (Solo lettere, cifre, spazi, _ e -, deve iniziare con una lettera.)"
        fi
    done
}

# Chiede uno o più stati da aggiungere alla keyword $1. Imposta CHANGED=1 se ne aggiunge.
add_states_to() {
    local kw="$1"
    declare -p "${kw}_STATES" >/dev/null 2>&1 || declare -ga "${kw}_STATES=()"
    local -n st="${kw}_STATES"
    echo "Scrivi gli stati di $kw uno alla volta (invio a vuoto per finire)."
    while true; do
        if ((${#st[@]} >= MAX_ITEMS)); then
            echo "Siamo al completo, come il Frecciarossa a Ferragosto (Massimo $MAX_ITEMS stati per keyword.)"
            break
        fi
        read_name "Nuovo stato per $kw: " "$STATE_PATTERN" || break
        if contains "$NAME" "${st[@]}"; then
            echo "Déjà vu! (Lo stato $NAME esiste già in $kw.)"
            continue
        fi
        st+=("$NAME")
        CHANGED=1
    done
}

add_keyword() {
    local answer
    ((${#KEYWORDS[@]} >= MAX_ITEMS)) \
        && die "Siamo al completo, come il Frecciarossa a Ferragosto (Massimo $MAX_ITEMS keyword.)"
    while true; do
        read_name "Nuova keyword (invio a vuoto per annullare): " "$KEYWORD_PATTERN" || return
        contains "$NAME" "${KEYWORDS[@]}" || break
        echo "Déjà vu! (La keyword $NAME esiste già.)"
    done
    KEYWORDS+=("$NAME")
    CHANGED=1
    read -rp "Vuoi aggiungere degli stati a $NAME? (y/n): " answer
    [[ "$answer" == [yY] ]] && add_states_to "$NAME"
}

add_state() {
    pick "Keyword a cui aggiungere lo stato" "" "${KEYWORDS[@]}"
    add_states_to "$CHOICE"
}

# Riscrive il blocco tra i marker con le keyword e gli stati attuali.
save_config() {
    local self tmp block kw s line
    self=$(readlink -f "${BASH_SOURCE[0]}")
    [[ -w "$self" ]] || die "Non posso scrivere su $self"
    if [[ $(grep -cxF '# >>> keyword >>>' "$self") != 1 || $(grep -cxF '# <<< keyword <<<' "$self") != 1 ]]; then
        die "Marker del blocco keyword mancanti o duplicati in $self (file non modificato)"
    fi

    line="KEYWORDS=("
    for kw in "${KEYWORDS[@]}"; do
        line+="\"$kw\" "
    done
    block="${line% })"
    for kw in "${KEYWORDS[@]}"; do
        has_states "$kw" || continue
        local -n st="${kw}_STATES"
        line="${kw}_STATES=("
        for s in "${st[@]}"; do
            line+="\"$s\" "
        done
        block+=$'\n'"${line% })"
        unset -n st
    done

    # Nuovo file accanto all'originale + mv: bash sta ancora leggendo questo script,
    # sovrascriverlo sul posto potrebbe fargli eseguire codice a metà.
    tmp=$(mktemp "$(dirname "$self")/.commit.XXXXXX") || die "Impossibile creare un file temporaneo"
    BLOCK="$block" awk '
        $0 == "# >>> keyword >>>" { print; print ENVIRON["BLOCK"]; skip = 1; next }
        $0 == "# <<< keyword <<<" { skip = 0 }
        !skip
    ' "$self" > "$tmp"
    chmod --reference="$self" "$tmp"
    if ! bash -n "$tmp"; then
        rm -f "$tmp"
        die "Il nuovo script avrebbe errori di sintassi (file non modificato)"
    fi
    mv -f "$tmp" "$self" || { rm -f "$tmp"; die "Impossibile aggiornare $self"; }
}

add_mode() {
    CHANGED=0
    pick "Cosa vuoi aggiungere" "" "KEYWORD" "STATO"
    case "$CHOICE" in
        KEYWORD) add_keyword ;;
        STATO) add_state ;;
    esac
    if ((CHANGED == 0)); then
        echo "Nessuna modifica."
        exit 0
    fi
    save_config
    echo
    echo "Fatto! Ecco le keyword aggiornate:"
    echo
    show_menu "${KEYWORDS[@]}"
    echo
    echo "Ricordati di committare scripts/commit/commit.sh (e aggiornare la tabella nel README) per condividerle col gruppo."
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
fi

if [[ "$1" == "--add" ]]; then
    add_mode
    exit 0
fi

# --- Argomenti numerici iniziali: keyword ed eventuale stato ---
kw_arg="" state_arg=""
if [[ "$1" =~ ^([0-9])([0-9])$ ]]; then
    # "commit 13" equivale a "commit 1 3"
    kw_arg="${BASH_REMATCH[1]}"
    state_arg="${BASH_REMATCH[2]}"
    shift
elif [[ "$1" =~ ^[0-9]+$ ]]; then
    kw_arg="$1"
    shift
    if [[ "$1" =~ ^[0-9]+$ ]]; then
        state_arg="$1"
        shift
    fi
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Guarda guarda guarda... qualcuno cerca il sale grosso alla LeroyMarlin eh? (Non sei in una repo git)."
    exit 1
fi

if ! git diff --cached --quiet; then
    echo "Apri la mente giovane padawan, stavui per cascare nel tranello (Ci sono già modifiche in stage: committale o fai 'git restore --staged .' prima.)"
    exit 1
fi

for file in "$@"; do
    if [[ ! -e "$file" ]] && ! git ls-files --error-unmatch -- "$file" >/dev/null 2>&1; then
        echo "File non trovato: $file"
        exit 1
    fi
done

# --- Keyword e stato ---
SPLIT=1 pick "Keyword" "$kw_arg" "${KEYWORDS[@]}"
header="$CHOICE"
state_arg="${state_arg:-$NEXT_PRESET}"

if has_states "$header"; then
    declare -n header_states="${header}_STATES"
    pick "Stato $header" "$state_arg" "${header_states[@]}"
    header="$header: $CHOICE"
elif [[ -n "$state_arg" ]]; then
    echo "Hai appena confuso una spada laser con una ciabatta (La keyword $header non ha stati: $state_arg)"
    exit 1
fi

# --- Messaggio ---
msg=""
while [[ -z "$msg" ]]; do
	printf "Illuminami con la tua saggezza...\n\n"
    read -rp "Messaggio commit: " msg
done

# --- Stage ---
if (($# > 0)); then
    git add -- "$@" || exit 1
else
    git add -A || exit 1
fi

# --- Lista file (solo quelli effettivamente in stage) ---
mapfile -t files < <(git diff --cached --name-only)
if ((${#files[@]} == 0)); then
    echo "MA come stiamo andiamo?! (Niente da committare.)"
    exit 1
fi

file_list=""
for file in "${files[@]:0:3}"; do
    file_list+="${file_list:+, }${file##*/}"
done
((${#files[@]} > 3)) && file_list+="..."

# --- Commit e push ---
if ! git commit -m "$header | $msg | $file_list"; then
    git reset -q
    exit 1
fi

if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git push
else
    git push -u origin HEAD
fi && echo "Push eseguito." || { echo "Errore nel push."; exit 1; }
