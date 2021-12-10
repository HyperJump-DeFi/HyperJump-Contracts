#!/bin/bash
cat setclaim.head
cat ftm_pending_userrewards.csv | grep -v "\,\-" | cut -d ',' -f 1,3 | tail -n +2 | sed -e "s/\\..*\$//gm" -e "s/^/\ \ \ \ users\.push(\'/gm" -e "s/,/\'\)\;\ amounts\.push\(/gm" -e "s/\$/\);/gm" | grep -v "\=\ 0\;\$"
cat setclaim.foot
