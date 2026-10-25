"use client"

import type React from "react"

import PDFViewer from "@/components/ui/PDFViewer"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface LegalAgreementProps {
  onAgreementChange: (agreed: boolean) => void
  required?: boolean
}

const LegalAgreement: React.FC<LegalAgreementProps> = ({ onAgreementChange, required = true }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [showPDF, setShowPDF] = useState<{
    visible: boolean
    title: string
    url: string
  }>({
    visible: false,
    title: "",
    url: "",
  })

  // Replace these URLs with your actual PDF URLs
  const TERMS_URL = "https://app.treksor.com/public/terms-of-service.pdf"
  const PRIVACY_URL = "https://app.treksor.com/public/privacy-policy.pdf"
  const DISCLAIMER_URL = "https://app.treksor.com/public/disclaimer.pdf"

  const handleTermsChange = (agreed: boolean) => {
    setAgreedToTerms(agreed)
    updateAgreementStatus(agreed, agreedToPrivacy)
  }

  const handlePrivacyChange = (agreed: boolean) => {
    setAgreedToPrivacy(agreed)
    updateAgreementStatus(agreedToTerms, agreed)
  }

  const updateAgreementStatus = (terms: boolean, privacy: boolean) => {
    const allAgreed = terms && privacy
    onAgreementChange(allAgreed)
  }

  const openPDF = (title: string, url: string) => {
    setShowPDF({ visible: true, title, url })
  }

  const closePDF = () => {
    setShowPDF({ visible: false, title: "", url: "" })
  }

  const CheckboxItem = ({
    checked,
    onPress,
    children,
  }: {
    checked: boolean
    onPress: () => void
    children: React.ReactNode
  }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#000000" />}
      </View>
      <View style={styles.checkboxText}>{children}</View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legal Agreements</Text>
      <Text style={styles.subtitle}>Please review and accept our policies to continue</Text>

      {/* Terms of Service */}
      <CheckboxItem checked={agreedToTerms} onPress={() => handleTermsChange(!agreedToTerms)}>
        <Text style={styles.agreementText}>
          I agree to the{" "}
          <Text style={styles.linkText} onPress={() => openPDF("Terms of Service", TERMS_URL)}>
            Terms of Service
          </Text>
          {required && <Text style={styles.requiredText}> *</Text>}
        </Text>
      </CheckboxItem>

      {/* Privacy Policy */}
      <CheckboxItem checked={agreedToPrivacy} onPress={() => handlePrivacyChange(!agreedToPrivacy)}>
        <Text style={styles.agreementText}>
          I agree to the{" "}
          <Text style={styles.linkText} onPress={() => openPDF("Privacy Policy", PRIVACY_URL)}>
            Privacy Policy
          </Text>
          {required && <Text style={styles.requiredText}> *</Text>}
        </Text>
      </CheckboxItem>

      {/* Additional Links */}
      <View style={styles.additionalLinks}>
        <TouchableOpacity onPress={() => openPDF("Disclaimer", DISCLAIMER_URL)}>
          <Text style={styles.linkText}>View Disclaimer</Text>
        </TouchableOpacity>
      </View>

      {required && <Text style={styles.requiredNote}>* Required to create an account</Text>}

      {/* PDF Modal */}
      <Modal visible={showPDF.visible} animationType="slide" presentationStyle="fullScreen">
        <PDFViewer title={showPDF.title} pdfUrl={showPDF.url} onClose={closePDF} />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 8, lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  subtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#666666",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#D7B877",
    borderColor: "#D7B877",
  },
  checkboxText: {
    flex: 1,
  },
  agreementText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  linkText: {
    color: "#D7B877",
    textDecorationLine: "underline",
  },
  requiredText: {
    color: "#FF6B6B",
  },
  additionalLinks: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  requiredNote: {
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: 10,
    fontStyle: "italic",
  },
})

export default LegalAgreement
