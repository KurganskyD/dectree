#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
DecTree <- function(message, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = message

  # create widget
  htmlwidgets::createWidget(
    name = 'DecTree',
    x,
    width = width,
    height = height,
    package = 'DecTree',
    elementId = elementId
  )
}

#' Shiny bindings for DecTree
#'
#' Output and render functions for using DecTree within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a DecTree
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name DecTree-shiny
#'
#' @export
DecTreeOutput <- function(outputId, width = '100%', height = '800px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'DecTree', width, height, package = 'DecTree')
}

#' @rdname DecTree-shiny
#' @export
renderDecTree <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, DecTreeOutput, env, quoted = TRUE)
}
