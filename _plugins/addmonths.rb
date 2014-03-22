module Jekyll
	class MonthsFromNowTag < Liquid::Tag

		@months = nil

		def initialize(tag_name, markup, tokens)
			@months = markup
			super
		end

		def render(context)
			(Date.today >> @months.to_i).strftime('%b %Y')
		end

	end
end

Liquid::Template.register_tag('months_from_now', Jekyll::MonthsFromNowTag)