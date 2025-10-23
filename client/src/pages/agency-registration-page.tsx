import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Building2, User, MapPin, CheckCircle2, ArrowLeft, ArrowRight, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type FormData = {
  // Business Profile
  legalName: string;
  tradeName: string;
  type: string;
  licenseNo: string;
  yearEstablished: string;
  country: string;
  website: string;
  description: string;
  
  // Primary Contact
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactMobile: string;
  contactPassword: string;
  contactPasswordConfirm: string;
  
  // Address
  street: string;
  city: string;
  region: string;
  postalCode: string;
  addressCountry: string;
};

export default function AgencyRegistrationPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    legalName: "",
    tradeName: "",
    type: "travel_agency",
    licenseNo: "",
    yearEstablished: "",
    country: "",
    website: "",
    description: "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactMobile: "",
    contactPassword: "",
    contactPasswordConfirm: "",
    street: "",
    city: "",
    region: "",
    postalCode: "",
    addressCountry: "",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/agencies/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: "Your travel agency has been registered. You can now login with your credentials.",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.legalName || !formData.country) {
        toast({
          title: "Required fields missing",
          description: "Please fill in Legal Name and Country",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.contactName || !formData.contactEmail || !formData.contactPassword) {
        toast({
          title: "Required fields missing",
          description: "Please fill in Contact Name, Email, and Password",
          variant: "destructive",
        });
        return false;
      }
      if (formData.contactPassword !== formData.contactPasswordConfirm) {
        toast({
          title: "Passwords don't match",
          description: "Please ensure both passwords are the same",
          variant: "destructive",
        });
        return false;
      }
      if (formData.contactPassword.length < 6) {
        toast({
          title: "Password too short",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.street || !formData.city || !formData.addressCountry) {
        toast({
          title: "Required fields missing",
          description: "Please fill in Street, City, and Country",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      registerMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Plane className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Royal VIP Tours</h1>
          </div>
          <h2 className="text-xl font-semibold">Travel Agency Registration</h2>
          <p className="text-sm text-muted-foreground">
            Join our B2B platform and start receiving quotes from local suppliers
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={step >= 1 ? "text-primary font-medium" : ""}>Business Profile</span>
            <span className={step >= 2 ? "text-primary font-medium" : ""}>Primary Contact</span>
            <span className={step >= 3 ? "text-primary font-medium" : ""}>Address</span>
            <span className={step >= 4 ? "text-primary font-medium" : ""}>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <><Building2 className="h-5 w-5" /> Business Profile</>}
              {step === 2 && <><User className="h-5 w-5" /> Primary Contact</>}
              {step === 3 && <><MapPin className="h-5 w-5" /> Business Address</>}
              {step === 4 && <><CheckCircle2 className="h-5 w-5" /> Review & Submit</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your travel agency"}
              {step === 2 && "Who will be the main contact and login user?"}
              {step === 3 && "Where is your business located?"}
              {step === 4 && "Review your information before submitting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Business Profile */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Business Name *</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => updateField("legalName", e.target.value)}
                    placeholder="ABC Travel Ltd."
                    required
                    data-testid="input-legal-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeName">Trade Name (if different)</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={(e) => updateField("tradeName", e.target.value)}
                    placeholder="ABC Travel"
                    data-testid="input-trade-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Agency Type</Label>
                  <Select value={formData.type} onValueChange={(v) => updateField("type", v)}>
                    <SelectTrigger data-testid="select-agency-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel_agency">Travel Agency</SelectItem>
                      <SelectItem value="tour_operator">Tour Operator</SelectItem>
                      <SelectItem value="dmc">DMC (Destination Management Company)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNo">License Number</Label>
                    <Input
                      id="licenseNo"
                      value={formData.licenseNo}
                      onChange={(e) => updateField("licenseNo", e.target.value)}
                      placeholder="TL-12345"
                      data-testid="input-license-no"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearEstablished">Year Established</Label>
                    <Input
                      id="yearEstablished"
                      type="number"
                      value={formData.yearEstablished}
                      onChange={(e) => updateField("yearEstablished", e.target.value)}
                      placeholder="2010"
                      data-testid="input-year-established"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    placeholder="United States"
                    required
                    data-testid="input-country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://www.example.com"
                    data-testid="input-website"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Tell us about your agency, services, and specialties..."
                    rows={4}
                    data-testid="input-description"
                  />
                </div>
              </>
            )}

            {/* Step 2: Primary Contact */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    placeholder="John Doe"
                    required
                    data-testid="input-contact-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactTitle">Job Title</Label>
                  <Input
                    id="contactTitle"
                    value={formData.contactTitle}
                    onChange={(e) => updateField("contactTitle", e.target.value)}
                    placeholder="Managing Director"
                    data-testid="input-contact-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    placeholder="john@example.com"
                    required
                    data-testid="input-contact-email"
                  />
                  <p className="text-xs text-muted-foreground">This will be your login email</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactMobile">Mobile / WhatsApp</Label>
                  <Input
                    id="contactMobile"
                    type="tel"
                    value={formData.contactMobile}
                    onChange={(e) => updateField("contactMobile", e.target.value)}
                    placeholder="+1 234 567 8900"
                    data-testid="input-contact-mobile"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPassword">Password *</Label>
                  <Input
                    id="contactPassword"
                    type="password"
                    value={formData.contactPassword}
                    onChange={(e) => updateField("contactPassword", e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="input-contact-password"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPasswordConfirm">Confirm Password *</Label>
                  <Input
                    id="contactPasswordConfirm"
                    type="password"
                    value={formData.contactPasswordConfirm}
                    onChange={(e) => updateField("contactPasswordConfirm", e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="input-contact-password-confirm"
                  />
                </div>
              </>
            )}

            {/* Step 3: Address */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    placeholder="123 Main Street"
                    required
                    data-testid="input-street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="New York"
                      required
                      data-testid="input-city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">State / Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => updateField("region", e.target.value)}
                      placeholder="NY"
                      data-testid="input-region"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value)}
                      placeholder="10001"
                      data-testid="input-postal-code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressCountry">Country *</Label>
                    <Input
                      id="addressCountry"
                      value={formData.addressCountry}
                      onChange={(e) => updateField("addressCountry", e.target.value)}
                      placeholder="United States"
                      required
                      data-testid="input-address-country"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Business Information
                  </h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Legal Name</dt>
                      <dd className="font-medium">{formData.legalName}</dd>
                    </div>
                    {formData.tradeName && (
                      <div>
                        <dt className="text-muted-foreground">Trade Name</dt>
                        <dd className="font-medium">{formData.tradeName}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-medium capitalize">{formData.type.replace(/_/g, " ")}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Country</dt>
                      <dd className="font-medium">{formData.country}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Primary Contact
                  </h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{formData.contactName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{formData.contactEmail}</dd>
                    </div>
                    {formData.contactTitle && (
                      <div>
                        <dt className="text-muted-foreground">Title</dt>
                        <dd className="font-medium">{formData.contactTitle}</dd>
                      </div>
                    )}
                    {formData.contactMobile && (
                      <div>
                        <dt className="text-muted-foreground">Mobile</dt>
                        <dd className="font-medium">{formData.contactMobile}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Business Address
                  </h3>
                  <dl className="text-sm">
                    <dd className="font-medium">
                      {formData.street}<br />
                      {formData.city}{formData.region && `, ${formData.region}`} {formData.postalCode}<br />
                      {formData.addressCountry}
                    </dd>
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  data-testid="button-prev-step"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {step < totalSteps && (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto"
                  data-testid="button-next-step"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {step === totalSteps && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                  className="ml-auto"
                  data-testid="button-submit-registration"
                >
                  {registerMutation.isPending ? "Submitting..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => setLocation("/auth")}
            data-testid="link-back-to-login"
          >
            Already have an account? Login here
          </Button>
        </div>
      </div>
    </div>
  );
}
