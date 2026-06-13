// src/data/contratoMenu.js
// Árbol de temas del Chat de Beneficios.
// Personalizable por cliente: ajusta labels, iconos o secciones según su Convenio Colectivo.
// Los códigos en 'secciones' deben coincidir con la columna 'codigo' de la tabla contrato_secciones en Supabase.

export const CONTRATO_MENU = [
  {
    "id": "permisos",
    "label": "Días de permiso pagados",
    "icono": "CalendarCheck",
    "subtemas": [
      {
        "id": "matrimonio",
        "label": "Matrimonio o Acuerdo de Unión Civil",
        "secciones": [
          "III.1"
        ]
      },
      {
        "id": "fallecimiento",
        "label": "Fallecimiento de un familiar",
        "secciones": [
          "III.2"
        ]
      },
      {
        "id": "dia_admin",
        "label": "Día administrativo trimestral",
        "secciones": [
          "III.3"
        ]
      },
      {
        "id": "dia_seguro",
        "label": "Día del Trabajador del Seguro",
        "secciones": [
          "III.4"
        ]
      },
      {
        "id": "salida_anticipada",
        "label": "Salida anticipada (17 sept / 24-31 dic)",
        "secciones": [
          "III.5"
        ]
      },
      {
        "id": "nacimiento",
        "label": "Nacimiento o adopción de un hijo/a",
        "secciones": [
          "III.6"
        ]
      },
      {
        "id": "mudanza",
        "label": "Cambio de domicilio (mudanza)",
        "secciones": [
          "III.7"
        ]
      },
      {
        "id": "reglas_permisos",
        "label": "Reglas generales de los permisos",
        "secciones": [
          "III.8"
        ]
      }
    ]
  },
  {
    "id": "remuneraciones",
    "label": "Remuneraciones y bonos mensuales",
    "icono": "DollarSign",
    "subtemas": [
      {
        "id": "gratificacion",
        "label": "Gratificación anual",
        "secciones": [
          "IV.1"
        ]
      },
      {
        "id": "teletrabajo",
        "label": "Asignación teletrabajo y movilización",
        "secciones": [
          "IV.2"
        ]
      },
      {
        "id": "colacion",
        "label": "Asignación de colación",
        "secciones": [
          "IV.3"
        ]
      },
      {
        "id": "reajustes",
        "label": "Reajustes del sueldo (IPC)",
        "secciones": [
          "II.1",
          "II.2"
        ]
      }
    ]
  },
  {
    "id": "bonos_anuales",
    "label": "Bonos y aguinaldos anuales",
    "icono": "Gift",
    "subtemas": [
      {
        "id": "navidad",
        "label": "Bono / Aguinaldo de Navidad",
        "secciones": [
          "IV.4"
        ]
      },
      {
        "id": "fiestas_patrias",
        "label": "Bono / Aguinaldo Fiestas Patrias",
        "secciones": [
          "IV.5"
        ]
      },
      {
        "id": "vacaciones",
        "label": "Bono de Vacaciones",
        "secciones": [
          "IV.6"
        ]
      },
      {
        "id": "escolar",
        "label": "Bono Escolar",
        "secciones": [
          "IV.7"
        ]
      },
      {
        "id": "antiguedad",
        "label": "Bono y permiso por antigüedad",
        "secciones": [
          "IV.8"
        ]
      },
      {
        "id": "invierno",
        "label": "Bono de Invierno",
        "secciones": [
          "V.5"
        ]
      }
    ]
  },
  {
    "id": "salud_emergencia",
    "label": "Salud, licencias y emergencias",
    "icono": "HeartPulse",
    "subtemas": [
      {
        "id": "licencia_medica",
        "label": "Subsidio por licencia médica",
        "secciones": [
          "V.2"
        ]
      },
      {
        "id": "prestamo",
        "label": "Préstamo de emergencia",
        "secciones": [
          "V.1"
        ]
      },
      {
        "id": "seguro_vida",
        "label": "Seguro de vida",
        "secciones": [
          "V.3"
        ]
      },
      {
        "id": "cuota_mortuoria",
        "label": "Cuota mortuoria",
        "secciones": [
          "V.4"
        ]
      },
      {
        "id": "deducible_salud",
        "label": "Deducible seguro complementario",
        "secciones": [
          "V.6"
        ]
      }
    ]
  },
  {
    "id": "termino_laboral",
    "label": "Término de la relación laboral",
    "icono": "FileSignature",
    "subtemas": [
      {
        "id": "indemnizacion_despido",
        "label": "Indemnización por despido",
        "secciones": [
          "VI.1"
        ]
      },
      {
        "id": "indemnizacion_jubilacion",
        "label": "Indemnización por jubilación",
        "secciones": [
          "VI.2"
        ]
      }
    ]
  },
  {
    "id": "general",
    "label": "Información general del convenio",
    "icono": "Info",
    "subtemas": [
      {
        "id": "vigencia",
        "label": "Vigencia del convenio",
        "secciones": [
          "VII.3"
        ]
      },
      {
        "id": "definiciones",
        "label": "Definiciones (UF, carga familiar, etc.)",
        "secciones": [
          "I.4"
        ]
      },
      {
        "id": "incompatibilidad",
        "label": "Incompatibilidad de beneficios",
        "secciones": [
          "VII.2"
        ]
      }
    ]
  }
]
