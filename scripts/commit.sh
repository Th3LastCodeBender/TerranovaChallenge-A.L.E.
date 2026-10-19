#!/bin/bash
# Uso: commit [KEYWORD [STATO]] [file ...]
#   KEYWORD e STATO sono i numeri dei menu (es. "commit 1 3" = FEATURE: WORK IN PROGRESS)
#   senza file -> git add -A (tutta la repo)
#   con file   -> git add solo dei file indicati
# Formato commit: "KEYWORD[: STATO] | messaggio | file1, file2, file3..."

KEYWORDS=(FEATURE BUG REFACTORING CLEANING PERFORMANCE TEST WORKFLOW MERGE)
BUG_STATES=("FOUND" "FIX IN PROGRESS" "SOLVED")
FEATURE_STATES=("NEW" "UPDATE" "WORK IN PROGRESS")

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

# Mostra un menu numerato e salva la scelta in $CHOICE.
# Se $2 non è vuoto viene usato come scelta, senza mostrare il menu.
pick() {
    local prompt="$1" preset="$2" input i
    shift 2
    local options=("$@")
    if [[ -n "$preset" ]]; then
        match "$preset" "${options[@]}" && return
        echo "$prompt non valido: $preset"
        exit 1
    fi
    echo "$prompt:"
    echo
    for i in "${!options[@]}"; do
        printf "%d) %s\n" $((i + 1)) "${options[i]}"
    done
    echo
    while true; do
        read -rp "$prompt: " input
        match "$input" "${options[@]}" && return
        echo "Scelta non valida."
    done
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
fi

# --- Argomenti numerici iniziali: keyword ed eventuale stato ---
kw_arg="" state_arg=""
if [[ "$1" =~ ^[0-9]+$ ]]; then
    kw_arg="$1"
    shift
    if [[ "$1" =~ ^[0-9]+$ ]]; then
        state_arg="$1"
        shift
    fi
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Non sei in una repo git."
    exit 1
fi

if ! git diff --cached --quiet; then
    echo "Ci sono già modifiche in stage: committale o fai 'git restore --staged .' prima."
    exit 1
fi

for file in "$@"; do
    if [[ ! -e "$file" ]] && ! git ls-files --error-unmatch -- "$file" >/dev/null 2>&1; then
        echo "File non trovato: $file"
        exit 1
    fi
done

# --- Keyword e stato ---
pick "Keyword" "$kw_arg" "${KEYWORDS[@]}"
header="$CHOICE"

case "$header" in
    BUG)
        pick "Stato BUG" "$state_arg" "${BUG_STATES[@]}"
        header="BUG: $CHOICE"
        ;;
    FEATURE)
        pick "Stato FEATURE" "$state_arg" "${FEATURE_STATES[@]}"
        header="FEATURE: $CHOICE"
        ;;
    *)
        if [[ -n "$state_arg" ]]; then
            echo "La keyword $header non ha stati: $state_arg"
            exit 1
        fi
        ;;
esac

# --- Messaggio ---
msg=""
while [[ -z "$msg" ]]; do
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
    echo "Niente da committare."
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
