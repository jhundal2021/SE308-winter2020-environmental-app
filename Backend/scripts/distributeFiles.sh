#!/bin/bash
SETTINGS="files/settings.txt"
ZIPFILE=$1
RAWDATADIR=$(grep -oP '(?<=RAWDATADIR:).*' $SETTINGS)
FDADIR=$(grep -oP '(?<=FDADIR:).*' $SETTINGS)
DATASOURCE=$(grep -oP '(?<=DATASOURCE:).*' $SETTINGS)
UPDATESOURCE=$(grep -oP '(?<=UPDATESOURCE:).*' $SETTINGS)
RAWDATADEST="${RAWDATADIR}${FDADIR}"
USAGE="Usage: ./distributeFiles.sh <zipfile> [OPTION] (use option -h for help)\n"
HELP="\t-b: bypass debug mode (don't keep temp files)\n"
HELP="${HELP}\t-h: print help\n"

debug=true
done=false

function checkSettings(){
   echo "settings check:"
   printf "\tSETTINGS: %s\n" $SETTINGS
   printf "\tZIPFILE: %s\n" $ZIPFILE
   printf "\tRAWDATADIR: %s\n" $RAWDATADIR
   printf "\tFDADIR: %s\n" $FDADIR
   printf "\tDATASOURCE: %s\n" $DATASOURCE
   printf "\tUPDATESOURCE: %s\n" $UPDATESOURCE
   printf "\tRAWDATADEST: %s\n" $RAWDATADEST
}

function expandArchive(){
   printf "unzipping %s...\n" $1
   unzip $1
}

function deleteUnneededFiles(){
   printf "removing unneeded files...\n"
   rm food.csv
   rm food_attribute.csv
   rm food_nutrient.csv
   rm all_downloaded_table_record_counts.csv
   rm Download*.pdf
   rm $1
}

function moveToRawFDADir(){
   printf "moving files to dataraw/FDA...\n"
   mv $1 $3
   mv $2 $3
}


if [[ $# -gt 1 ]] ; then
   if [ "$2" == "-b" ] ; then
      debug=false
   elif [ "$2" == "-h" ] ; then
      printf $HELP
      done=true
   else
      printf "$USAGE"
      done=true
   fi
elif [[ $# -lt 1 ]] ; then
   printf "$USAGE"
   done=true
fi

if [ $done == "false" ] ; then
   if [ $debug == "true" ] ; then
      checkSettings
   fi

   expandArchive $ZIPFILE

   if [ $debug == "false" ] ; then
      deleteUnneededFiles $ZIPFILE
   fi

   moveToRawFDADir $DATASOURCE $UPDATESOURCE $RAWDATADEST
fi
