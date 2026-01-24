import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Key, RotateCcw, Check, X, AlertTriangle, ArrowLeft, Loader2, Mail, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminPasswordManagement } from "@/hooks/useAdminPasswordManagement";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function AdminPasswordManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, role, loading: roleLoading } = useUserRole();
  const { 
    adminUsers, 
    resetRequests,
    loading, 
    maskedEmail, 
    hasPendingRequest,
    resetPasswordForUser, 
    sendResetEmailToUser, 
    requestEmailReset, 
    requestResetFromOwner,
    approveResetRequest,
    rejectResetRequest,
    refetch 
  } = useAdminPasswordManagement();
  const [resetTargetUser, setResetTargetUser] = useState<{ id: string; name: string; action: "delete" | "email" } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSelfResetDialog, setShowSelfResetDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const handleResetAction = async () => {
    if (!resetTargetUser) return;

    setIsResetting(true);
    try {
      if (resetTargetUser.action === "email") {
        await sendResetEmailToUser(resetTargetUser.id);
      } else {
        await resetPasswordForUser(resetTargetUser.id);
      }
      setResetTargetUser(null);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelfReset = async () => {
    setIsSendingEmail(true);
    try {
      const success = await requestEmailReset();
      if (success) {
        setShowSelfResetDialog(false);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRequestFromOwner = async () => {
    setIsSendingEmail(true);
    try {
      const success = await requestResetFromOwner();
      if (success) {
        setShowRequestDialog(false);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setProcessingRequest(requestId);
    try {
      await approveResetRequest(requestId, userId);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await rejectResetRequest(requestId);
    } finally {
      setProcessingRequest(null);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show different UI for admins vs owners
  const isAdmin = role === "admin";

  // Admin view - can only request reset from owner
  if (isAdmin && !isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>

          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Admin-Passwort zurücksetzen</CardTitle>
                  <CardDescription>
                    Fordere einen Passwort-Reset beim Owner an
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasPendingRequest ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-600 dark:text-yellow-400">Anfrage ausstehend</p>
                    <p className="text-sm text-muted-foreground">
                      Deine Anfrage wurde gesendet. Du erhältst eine E-Mail, sobald der Owner sie genehmigt.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Um dein Admin-Passwort zurückzusetzen, musst du eine Anfrage an den Owner senden. 
                    Nach Genehmigung erhältst du einen Reset-Link per E-Mail.
                  </p>
                  <Button onClick={() => setShowRequestDialog(true)} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Passwort-Reset anfordern
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Request Dialog */}
        <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Passwort-Reset anfordern
              </AlertDialogTitle>
              <AlertDialogDescription>
                Der Owner wird über deine Anfrage benachrichtigt und kann dir einen Reset-Link per E-Mail senden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSendingEmail}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleRequestFromOwner} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Anfrage senden
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
          <p className="text-muted-foreground mb-4">Diese Seite ist nur für Owner zugänglich.</p>
          <Button onClick={() => navigate("/admin")}>Zurück zum Admin-Dashboard</Button>
        </div>
      </div>
    );
  }

  // Find current user in admin users list
  const currentUserAdmin = adminUsers.find(u => u.user_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Dashboard
        </Button>

        {/* Pending Reset Requests - Only for Owner */}
        {resetRequests.length > 0 && (
          <Card className="mb-6 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Ausstehende Anfragen
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      {resetRequests.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Admins haben einen Passwort-Reset angefordert
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resetRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{request.display_name}</div>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Angefragt {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id, request.user_id)}
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Genehmigen
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequest === request.id}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Self-Reset Card for Owner */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Dein Admin-Passwort</CardTitle>
                <CardDescription>
                  Setze dein eigenes Admin-Passwort per E-Mail zurück
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {currentUserAdmin?.has_admin_password ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary text-primary">
                      <Check className="w-3 h-3 mr-1" />
                      Passwort eingerichtet
                    </Badge>
                    {currentUserAdmin.days_until_expiry <= 14 && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Läuft in {currentUserAdmin.days_until_expiry} Tagen ab
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">
                    <X className="w-3 h-3 mr-1" />
                    Nicht eingerichtet
                  </Badge>
                )}
                {maskedEmail && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Reset-Link wird an: {maskedEmail}
                  </p>
                )}
              </div>
              <Button onClick={() => setShowSelfResetDialog(true)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Passwort zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admin-Passwort Verwaltung
                </CardTitle>
                <CardDescription>
                  Verwalte Admin-Passwörter für alle Administratoren
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Admin-Benutzer gefunden</p>
                </div>
              ) : (
                adminUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {user.role === "owner" ? (
                          <Shield className="w-5 h-5 text-primary" />
                        ) : (
                          <Users className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.display_name}
                          <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Password Status */}
                      <div className="flex items-center gap-2">
                        {user.has_admin_password ? (
                          user.password_expired ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Abgelaufen
                            </Badge>
                          ) : user.days_until_expiry <= 14 ? (
                            <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
                              <AlertTriangle className="w-3 h-3" />
                              {user.days_until_expiry} Tage
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 border-primary text-primary">
                              <Check className="w-3 h-3" />
                              {user.days_until_expiry} Tage
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Nicht eingerichtet
                          </Badge>
                        )}
                      </div>

                      {/* Reset Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetTargetUser({ id: user.user_id, name: user.display_name, action: "email" })}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          E-Mail senden
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetTargetUser({ id: user.user_id, name: user.display_name, action: "delete" })}
                          disabled={!user.has_admin_password}
                          className="text-muted-foreground"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Hinweis
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>E-Mail senden:</strong> Sendet einen Reset-Link an die E-Mail des Admins</li>
                <li>• <strong>Löschen:</strong> Entfernt das Passwort - Admin muss beim nächsten Zugriff neu erstellen</li>
                <li>• Alle Aktionen werden im Audit-Log protokolliert</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={!!resetTargetUser} onOpenChange={(open) => !open && setResetTargetUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetTargetUser?.action === "email" 
                ? "Reset-Link per E-Mail senden?" 
                : "Admin-Passwort löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetTargetUser?.action === "email" ? (
                <>
                  Ein Reset-Link wird an <strong>{resetTargetUser?.name}</strong> per E-Mail gesendet.
                  Der Admin kann damit ein neues Passwort erstellen.
                </>
              ) : (
                <>
                  Das Admin-Passwort von <strong>{resetTargetUser?.name}</strong> wird gelöscht.
                  Der Admin muss beim nächsten Zugriff ein neues Passwort erstellen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAction} disabled={isResetting}>
              {isResetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : resetTargetUser?.action === "email" ? (
                <Mail className="w-4 h-4 mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {resetTargetUser?.action === "email" ? "E-Mail senden" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Self Reset Dialog */}
      <AlertDialog open={showSelfResetDialog} onOpenChange={setShowSelfResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Admin-Passwort per E-Mail zurücksetzen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ein Reset-Link wird an deine registrierte E-Mail-Adresse gesendet.
              {maskedEmail && (
                <span className="block mt-2 font-medium text-foreground">
                  E-Mail: {maskedEmail}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingEmail}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleSelfReset} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Reset-Link senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
