start=1
end=10
id=$start
# The Art Institute of Chicago has a collection of artworks, many of which are in the public domain
base_url=https://api.artic.edu/api/v1/artworks/

while [ $id -le $end ]
do
    # Construct the URL with the artworks ID
    url=$base_url$id

    # Use curl to fetch the URL and store the output in a variable
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)

    # Check if the HTTP status code is 200
    # if [ $response -eq 200 ]
    if [ $response -eq 200 ]
    then
        # The URL returns a 200 status code, so execute the code in this block
        echo "The URL $url returned a 200 status code!"
        # get the JSON data from the Chicago Institute of Art for the numbered artwork
        artic_json=$(curl -s $url)
        if [ "$(printf "%s" "$artic_json" | jq -r '.data.medium_display' | cut -c 1-3)" = "Oil" ]
        then
            # parse the JSON bits
            title=$(printf "%s" "$artic_json" | jq -r '.data.title')
            artist_title=$(printf "%s" "$artic_json" | jq -r '.data.artist_title')
            image_id=$(printf "%s" "$artic_json" | jq -r '.data.image_id')
            copyright_notice=$(printf "%s" "$artic_json" | jq -r '.data.copyright_notice')
            id=$(printf "%s" "$artic_json" | jq -r '.data.id')
            # multi-line string with special characters
            artist_display=$(printf "%s" "$artic_json" | jq -r '.data.artist_display' | jq -R -s -c '@text')
            medium_display=$(printf "%s" "$artic_json" | jq -r '.data.medium_display')
            date_display=$(printf "%s" "$artic_json" | jq -r '.data.date_display')
            alt_text=$(printf "%s" "$artic_json" | jq -r '.data.alt_text')
            classification_title=$(printf "%s" "$artic_json" | jq -r '.data.classification_title')
            place_of_origin=$(printf "%s" "$artic_json" | jq -r '.data.place_of_origin')
            is_public_domain=$(printf "%s" "$artic_json" | jq -r '.data.is_public_domain')

            #Construct the target image URL per: https://api.artic.edu/docs/#iiif-image-api
            url="https://www.artic.edu/iiif/2/$image_id/full/843,/0/default.jpg"

            # POST data to the Airtable API:
            curl -X POST "https://api.airtable.com/v0/{baseId}/{tableIdOrName}" \
            -H "Authorization: Bearer <YOUR_API_KEY>" \
            -H "Content-Type: application/json" \
            --data "{
                \"fields\":{
                    \"Attachment\": [
                        {
                            \"url\": \"$url\"
                        }
                    ],
                    \"Name\":\"$title\",
                    \"Artist\":\"$artist_title\",
                    \"image_id\":\"$image_id\",
                    \"Copyright Notice\":\"$copyright_notice\",
                    \"API ID\":$id,
                    \"Image URL\":\"$url\",
                    \"artist display\":$artist_display,
                    \"medium display\":\"$medium_display\",
                    \"date display\":\"$date_display\",
                    \"alt text\":\"$alt_text\",
                    \"classification title\":\"$classification_title\",
                    \"place of origin\":\"$place_of_origin\",
                    \"is_public_domain\":\"$is_public_domain\"
                }
            }"
        else
            # The .data.medium_display is not "Oil"
            # echo "The medium_display contains $medium_display, not Oil!"
            echo "The medium_display contains $(printf "%s" "$artic_json" | jq -r '.data.medium_display'), not Oil!"
        fi
    else
        # The URL does not return a 200 status code, so execute the code in this block
        echo "The URL $url returned a non-200 status code: $response"
    fi
    id=$((id + 1))
done
