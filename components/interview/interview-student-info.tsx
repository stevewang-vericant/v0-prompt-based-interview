"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, User, MapPin } from "lucide-react"
import { COUNTRIES, searchCountries } from "@/lib/countries"

interface StudentInfo {
  email: string
  name: string
  gender?: string | null
  currentGrade?: string | null
  residencyCity?: string | null
  residenceCountry: string
  needFinancialAid?: boolean | null
}

interface InterviewStudentInfoProps {
  onSubmit: (info: StudentInfo) => void
}

export function InterviewStudentInfo({ onSubmit }: InterviewStudentInfoProps) {
  const [studentEmail, setStudentEmail] = useState("")
  const [studentName, setStudentName] = useState("")
  const [emailError, setEmailError] = useState("")
  const [nameError, setNameError] = useState("")
  
  // Additional fields
  const [gender, setGender] = useState("")
  const [currentGrade, setCurrentGrade] = useState("")
  const [residencyCity, setResidencyCity] = useState("")
  const [residenceCountry, setResidenceCountry] = useState("")
  const [residenceCountryError, setResidenceCountryError] = useState("")
  const [needFinancialAid, setNeedFinancialAid] = useState<string>("")
  const [cityError, setCityError] = useState("")
  const [gradeError, setGradeError] = useState("")
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  
  // Country search dropdown state
  const [countrySearchQuery, setCountrySearchQuery] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [filteredCountries, setFilteredCountries] = useState<string[]>(COUNTRIES.slice(0, 20))
  const countryInputRef = useRef<HTMLInputElement>(null)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Update filtered countries when search query changes
  useEffect(() => {
    if (countrySearchQuery.trim()) {
      const filtered = searchCountries(countrySearchQuery)
      setFilteredCountries(filtered)
      // If the search query doesn't match the selected country, clear the selection
      if (residenceCountry && !filtered.includes(residenceCountry)) {
        setResidenceCountry("")
      }
    } else {
      setFilteredCountries(COUNTRIES.slice(0, 20))
      // If search is cleared and we have a selected country, keep it
      if (residenceCountry && !countrySearchQuery) {
        setCountrySearchQuery(residenceCountry)
      }
    }
  }, [countrySearchQuery, residenceCountry])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node) &&
        countryInputRef.current &&
        !countryInputRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleCountrySelect = (country: string) => {
    setResidenceCountry(country)
    setCountrySearchQuery(country)
    setShowCountryDropdown(false)
    setResidenceCountryError("")
  }

  const handleSubmit = () => {
    setHasAttemptedSubmit(true)
    let hasError = false

    // Validate email (required)
    if (!studentEmail.trim()) {
      setEmailError("Please enter your email address")
      hasError = true
    } else if (!validateEmail(studentEmail)) {
      setEmailError("Please enter a valid email address")
      hasError = true
    } else {
      setEmailError("")
    }

    // Validate name (required)
    if (!studentName.trim()) {
      setNameError("Please enter your full name")
      hasError = true
    } else {
      setNameError("")
    }

    // Validate residence country (required)
    if (!residenceCountry.trim()) {
      setResidenceCountryError("Please select your residence country")
      hasError = true
    } else {
      setResidenceCountryError("")
    }

    // Validate residency city (required)
    if (!residencyCity.trim()) {
      setCityError("Please enter your residency city")
      hasError = true
    } else {
      setCityError("")
    }

    // Validate current grade (required)
    if (!currentGrade.trim()) {
      setGradeError("Please select your current grade")
      hasError = true
    } else {
      setGradeError("")
    }

    if (hasError) {
      return
    }

    // Prepare student info
    const studentInfo: StudentInfo = {
      email: studentEmail.trim(),
      name: studentName.trim(),
      gender: gender || null,
      currentGrade: currentGrade || null,
      residencyCity: residencyCity.trim() || null,
      residenceCountry: residenceCountry.trim(),
      needFinancialAid: needFinancialAid === "yes" ? true : needFinancialAid === "no" ? false : null
    }

    onSubmit(studentInfo)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
          <CardDescription>
            Please provide your information before starting the interview. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={studentEmail}
                onChange={(e) => {
                  setStudentEmail(e.target.value)
                  setEmailError("")
                }}
                className={`pl-10 ${emailError ? "border-red-500" : ""}`}
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value)
                setNameError("")
              }}
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-sm text-red-600">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">
              Current Grade <span className="text-red-500">*</span>
            </Label>
            <Select value={currentGrade} onValueChange={(value) => {
              setCurrentGrade(value)
              setGradeError("")
            }}>
              <SelectTrigger id="grade" className={gradeError ? "border-red-500" : ""}>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9th Grade">9th Grade</SelectItem>
                <SelectItem value="10th Grade">10th Grade</SelectItem>
                <SelectItem value="11th Grade">11th Grade</SelectItem>
                <SelectItem value="12th Grade">12th Grade</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Graduate">Graduate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {gradeError && (
              <p className="text-sm text-red-600">{gradeError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">
              Residency City <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="city"
                type="text"
                placeholder="e.g., New York, London, Tokyo"
                value={residencyCity}
                onChange={(e) => {
                  setResidencyCity(e.target.value)
                  setCityError("")
                }}
                className={`pl-10 ${cityError ? "border-red-500" : ""}`}
              />
            </div>
            {cityError && (
              <p className="text-sm text-red-600">{cityError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">
              Residence Country <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                ref={countryInputRef}
                id="country"
                type="text"
                placeholder="Search and select your country..."
                value={countrySearchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setCountrySearchQuery(value)
                  setShowCountryDropdown(true)
                  // If user clears the input or changes it, check if it still matches selected country
                  if (!value.trim()) {
                    setResidenceCountry("")
                  } else if (residenceCountry && value.toLowerCase() !== residenceCountry.toLowerCase()) {
                    // If input doesn't match selected country, clear selection
                    const filtered = searchCountries(value)
                    if (!filtered.includes(residenceCountry)) {
                      setResidenceCountry("")
                    }
                  }
                }}
                onFocus={() => {
                  // Show dropdown when focused
                  setShowCountryDropdown(true)
                  // If we have a selected country, show it in the input
                  if (residenceCountry && !countrySearchQuery) {
                    setCountrySearchQuery(residenceCountry)
                  }
                }}
                className={residenceCountryError ? "border-red-500" : ""}
              />
              {showCountryDropdown && (
                <div
                  ref={countryDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                        onClick={() => handleCountrySelect(country)}
                      >
                        {country}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-slate-500">
                      No countries found
                    </div>
                  )}
                </div>
              )}
            </div>
            {residenceCountryError && (
              <p className="text-sm text-red-600">{residenceCountryError}</p>
            )}
            {residenceCountry && !residenceCountryError && (
              <p className="text-sm text-green-600">Selected: {residenceCountry}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Need Financial Aid? (Optional)</Label>
            <RadioGroup 
              value={needFinancialAid} 
              onValueChange={setNeedFinancialAid}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="aid-yes" />
                <Label htmlFor="aid-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="aid-no" />
                <Label htmlFor="aid-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
          >
            Continue to Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
