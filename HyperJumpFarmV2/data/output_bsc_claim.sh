#!/bin/bash
cat claim.head
cat bsc_pending_userrewards.csv | grep -v "\,\-" | cut -d ',' -f 1,3 | tail -n +2 | sed -e "s/^/\ \ \ \ amounts[address\(/gm" -e "s/,/\)\]\ \=\ /gm" -e "s/\\..*\$//gm" -e "s/\$/;/gm" | grep -v "\=\ 0\;\$"
cat claim.foot
