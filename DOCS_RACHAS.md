# Sistema de Rachas - Iron Body

Este documento explica el funcionamiento técnico y las reglas del sistema de rachas (streaks) implementado en la aplicación.

## 1. Funcionamiento de la Racha (Streak)

La racha representa el número de días **acumulados** en semanas consecutivas donde has cumplido tu objetivo.

### Reglas Principales:
*   **Objetivo Semanal**: Debes registrar asistencia al menos **4 días** en una semana (Lunes a Domingo).
*   **Mantenimiento**: Mientras cumplas los 4 días cada semana, tu racha seguirá creciendo.
*   **Flexibilidad Diaria**: Puedes faltar cualquier día de la semana sin perder la racha, siempre que al final de la semana sumes los 4 días requeridos.
*   **Pérdida de Racha**: Si termina el domingo y solo has registrado 3 días o menos, la racha se reiniciará a **0** al comenzar el lunes siguiente.

### Cómo se calcula el número:
El número que ves como racha es la **suma total de días asistidos** en todas las semanas consecutivas exitosas.
*   **Semana 1**: Vas 4 días. Racha = 4.
*   **Semana 2**: Vas 5 días. Racha = 9.
*   **Semana 3**: Es martes y solo has ido 1 día. Tu racha sigue siendo **9** (esperando a que completes tus 4 días de esta semana).
*   **Semana 3 (Viernes)**: Completas tu 4º día. Tu racha salta a **13**.

---
## 2. Impacto en el Ranking (Bono de Consistencia)

La racha ahora influye directamente en tu nivel de ranking (Tier). No solo importa cuánto peso levantas, sino qué tan constante eres.

*   **Bono de Consistencia**: Por cada **30 días** de racha acumulada, recibes un **+1.0 de nivel** en tu ranking general.
*   **Tope**: El bono máximo es de +1.0 (equivalente a subir un Tier completo, por ejemplo de *Chagra* a *Capo*).
*   **Cálculo**: `Nivel Final = Nivel por Fuerza + (Días de Racha / 30)`.
*   **Pérdida**: Si pierdes la racha, pierdes el bono de consistencia inmediatamente, lo que podría bajar tu Tier de ranking.

---
## 3. Detalles Técnicos (Para Desarrolladores)

*   **Tabla**: `attendance_logs`
*   **Identificador de fecha**: Se utiliza el formato `YYYY-MM-DD` basado en la zona horaria local.
*   **Límite de Consulta**: El sistema analiza los últimos **90 días** para calcular las semanas consecutivas.
*   **Agrupación**: Los días se agrupan por semanas empezando siempre en **Lunes**.
*   **Cómputo en Tiempo Real**: La racha se recalcula cada vez que el usuario abre la aplicación o realiza un check-in.


---

> [!TIP]
> **Futuras Mejoras**: Estamos evaluando implementar "Freezes" o "Días de Descanso" que permitan saltar 1 o 2 días a la semana sin perder la racha acumulada.
