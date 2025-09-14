import React, { useEffect, useRef, useState } from 'react'

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: any) => void
  placeholder?: string
  className?: string
  required?: boolean
  apiKey: string
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter your address",
  className = "",
  required = false,
  apiKey
}: GooglePlacesAutocompleteProps) {
  const autocompleteRef = useRef<HTMLElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google?.maps?.importLibrary) {
        setIsLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        setIsLoaded(true)
      }
      
      script.onerror = () => {
        setError('Failed to load Google Maps API')
      }

      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [apiKey])

  useEffect(() => {
    if (!isLoaded || !autocompleteRef.current) return

    const initAutocomplete = async () => {
      try {
        // Use the new Places API
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary
        
        const autocompleteElement = new PlaceAutocompleteElement({
          componentRestrictions: { country: 'AU' },
          fields: ['place_id', 'geometry', 'name', 'formatted_address']
        })

        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          const place = event.place
          if (place && place.formattedAddress) {
            onChange(place.formattedAddress)
            onPlaceSelect?.(place)
          }
        })

        // Replace the input with the autocomplete element
        if (autocompleteRef.current?.parentNode) {
          autocompleteRef.current.parentNode.replaceChild(autocompleteElement, autocompleteRef.current)
          autocompleteRef.current = autocompleteElement
          
          // Style the autocomplete element
          autocompleteElement.style.width = '100%'
          autocompleteElement.style.height = '42px'
          autocompleteElement.style.padding = '8px 12px'
          autocompleteElement.style.border = '1px solid #d1d5db'
          autocompleteElement.style.borderRadius = '8px'
          autocompleteElement.style.fontSize = '16px'
          autocompleteElement.style.outline = 'none'
          
          // Set placeholder and value
          autocompleteElement.placeholder = placeholder
          if (value) {
            autocompleteElement.value = value
          }
        }
      } catch (err) {
        console.error('Error initializing Places Autocomplete:', err)
        setError('Failed to initialize address autocomplete')
      }
    }

    initAutocomplete()
  }, [isLoaded, onChange, onPlaceSelect, placeholder, value])

  if (error) {
    // Fallback to regular input on error
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
      />
    )
  }

  return (
    <input
      ref={autocompleteRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isLoaded ? placeholder : "Loading address search..."}
      className={className}
      required={required}
    />
  )
}