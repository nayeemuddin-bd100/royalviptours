import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Globe2, Building2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  // Redirect if already logged in (after hooks to avoid violating rules of hooks)
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginMutation.mutateAsync({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerMutation.mutateAsync({
      email: registerEmail,
      password: registerPassword,
      name: registerName,
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Column - Forms */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Plane className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Royal VIP Tours</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              B2B Travel Platform for Ground Operations & Quotations
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        data-testid="input-login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Create an account</CardTitle>
                  <CardDescription>
                    Join Royal VIP Tours and start managing your travel operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        data-testid="input-register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        data-testid="input-register-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="hidden lg:flex items-center justify-center p-8 bg-primary text-primary-foreground">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">
              Connect Suppliers with Travel Agencies Worldwide
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Royal VIP Tours is the premier B2B platform for ground operations, enabling seamless quotation workflows between local suppliers and travel agencies.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Globe2 className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1">Multi-Tenant Architecture</h3>
                <p className="text-sm text-primary-foreground/80">
                  Manage suppliers across multiple countries with tenant isolation and role-based access control
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1">Supplier Catalogues</h3>
                <p className="text-sm text-primary-foreground/80">
                  Transport companies, hotels, tour guides, and attractions maintain their own services and pricing
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Plane className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1">Automated Quotations</h3>
                <p className="text-sm text-primary-foreground/80">
                  Build itineraries, request quotes from suppliers, and compile comprehensive proposals for clients
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
