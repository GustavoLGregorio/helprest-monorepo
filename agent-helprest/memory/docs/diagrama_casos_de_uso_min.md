@startuml
title HelpRest - MVP (Minimum Viable Product)

left to right direction

actor "Usuário" as user
actor "Estab. Admin" as estAdmin

rectangle "HelpRest MVP" {
  
  package "Autenticação & Perfil" {
    user --> (Autenticação Básica)
    user --> (Configurar Restrições/Flags)
  }
  
  package "Descoberta" {
    user --> (Mapa de Estabelecimentos)
    user --> (Visualizar Perfil e Cardápio)
    
    (Mapa de Estabelecimentos) .> (Visualizar Perfil e Cardápio) : <<extend>>
  }
  
  package "Social" {
    user --> (Feed Social Básico)
    estAdmin --> (Publicar no Feed)
  }
  
  package "Gestão" {
    estAdmin --> (Editar Perfil do Estab.)
    estAdmin --> (Gerenciar Cardápio e Flags)
  }

}
@enduml
